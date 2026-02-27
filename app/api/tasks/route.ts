import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getXpForTask, calcLevel } from '@/lib/utils/xp';
import { checkBadges } from '@/lib/utils/badge';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const goal_id = request.nextUrl.searchParams.get('goal_id');

    if (!goal_id) {
      return NextResponse.json({ error: 'goal_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('goal_id', goal_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { goal_id, title, type, due_date } = body;

    if (!goal_id || !title || !type) {
      return NextResponse.json({ error: 'goal_id, title, and type are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({ goal_id, title, type, due_date: due_date || null })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // If marking as completed, handle XP and streak logic
    if (updates.is_completed === true) {
      updates.completed_at = new Date().toISOString();

      // Get the task to find its goal and type
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*, goal:goals(user_id)')
        .eq('id', id)
        .single();

      if (taskError || !task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const userId = task.goal.user_id;
      const xpAmount = getXpForTask(task.type);

      // Get current user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Calculate streak
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = user.streak_count;

      if (user.last_task_date === yesterday) {
        newStreak = user.streak_count + 1;
      } else if (user.last_task_date !== today) {
        newStreak = 1;
      }

      // Update XP, level, streak
      const newXp = user.xp + xpAmount;
      const newLevel = calcLevel(newXp);

      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          xp: newXp,
          level: newLevel,
          streak_count: newStreak,
          last_task_date: today,
        })
        .eq('id', userId);

      if (updateUserError) {
        return NextResponse.json({ error: updateUserError.message }, { status: 500 });
      }

      // Check and award badges
      const { count: totalCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true)
        .in('goal_id', (
          await supabase.from('goals').select('id').eq('user_id', userId)
        ).data?.map((g: { id: string }) => g.id) || []);

      const { count: commentsSent } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('from_user_id', userId);

      // Check monthly goal: all monthly tasks for a goal completed
      const { data: userGoals } = await supabase
        .from('goals')
        .select('id, tasks(*)')
        .eq('user_id', userId);

      let monthlyGoalAchieved = false;
      let yearlyGoalCompleted = false;
      let weeklyAllDone = false;

      if (userGoals) {
        for (const goal of userGoals) {
          const tasks = goal.tasks || [];
          if (tasks.length === 0) continue;

          const monthlyTasks = tasks.filter((t: { type: string }) => t.type === 'monthly');
          if (monthlyTasks.length > 0 && monthlyTasks.every((t: { is_completed: boolean }) => t.is_completed)) {
            monthlyGoalAchieved = true;
          }

          const weeklyTasks = tasks.filter((t: { type: string }) => t.type === 'weekly');
          if (weeklyTasks.length > 0 && weeklyTasks.every((t: { is_completed: boolean }) => t.is_completed)) {
            weeklyAllDone = true;
          }

          if (tasks.length > 0 && tasks.every((t: { is_completed: boolean }) => t.is_completed)) {
            yearlyGoalCompleted = true;
          }
        }
      }

      const earnedBadges = checkBadges({
        totalTasksCompleted: (totalCompleted || 0) + 1,
        streakCount: newStreak,
        monthlyGoalAchieved,
        commentsSent: commentsSent || 0,
        yearlyGoalCompleted,
        weeklyAllDone,
      });

      // Insert new badges, ignoring duplicates
      for (const badgeType of earnedBadges) {
        await supabase
          .from('badges')
          .upsert(
            { user_id: userId, badge_type: badgeType },
            { onConflict: 'user_id,badge_type', ignoreDuplicates: true }
          );
      }
    }

    // Update the task itself
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
