import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calcLevel } from '@/lib/utils/xp';
import { checkBadges } from '@/lib/utils/badge';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { userId, amount, reason } = body;

    if (!userId || amount === undefined || !reason) {
      return NextResponse.json({ error: 'userId, amount, and reason are required' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newXp = user.xp + amount;
    const newLevel = calcLevel(newXp);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ xp: newXp, level: newLevel })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

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
        if (monthlyTasks.length > 0 && monthlyTasks.every((t: { is_completed: boolean }) => t.is_completed)) monthlyGoalAchieved = true;
        const weeklyTasks = tasks.filter((t: { type: string }) => t.type === 'weekly');
        if (weeklyTasks.length > 0 && weeklyTasks.every((t: { is_completed: boolean }) => t.is_completed)) weeklyAllDone = true;
        if (tasks.length > 0 && tasks.every((t: { is_completed: boolean }) => t.is_completed)) yearlyGoalCompleted = true;
      }
    }

    const earnedBadges = checkBadges({
      totalTasksCompleted: totalCompleted || 0,
      streakCount: updatedUser.streak_count,
      monthlyGoalAchieved,
      commentsSent: commentsSent || 0,
      yearlyGoalCompleted,
      weeklyAllDone,
    });

    for (const badgeType of earnedBadges) {
      await supabase
        .from('badges')
        .upsert(
          { user_id: userId, badge_type: badgeType },
          { onConflict: 'user_id,badge_type', ignoreDuplicates: true }
        );
    }

    return NextResponse.json(updatedUser);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
