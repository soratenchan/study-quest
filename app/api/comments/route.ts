import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { XP_TABLE, calcLevel } from '@/lib/utils/xp';
import { checkBadges } from '@/lib/utils/badge';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const to_user_id = request.nextUrl.searchParams.get('to_user_id');
    const room_id = request.nextUrl.searchParams.get('room_id');

    if (room_id) {
      // ルーム内の全コメントを取得 (双方向)
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('room_id', room_id);

      const userIds = users?.map((u: { id: string }) => u.id) || [];

      const { data, error } = await supabase
        .from('comments')
        .select('*, from_user:users!from_user_id(*)')
        .in('from_user_id', userIds)
        .in('to_user_id', userIds)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    if (!to_user_id) {
      return NextResponse.json({ error: 'to_user_id or room_id is required' }, { status: 400 });
    }

    const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';
    let query = supabase
      .from('comments')
      .select('*, from_user:users!from_user_id(*)')
      .eq('to_user_id', to_user_id);
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { from_user_id, to_user_id, content, stamp } = body;

    if (!from_user_id || !to_user_id) {
      return NextResponse.json({ error: 'from_user_id and to_user_id are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        from_user_id,
        to_user_id,
        content: content || null,
        stamp: stamp || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 送信者に +3 XP
    const { data: sender } = await supabase
      .from('users')
      .select('*')
      .eq('id', from_user_id)
      .single();

    if (sender) {
      const newXp = sender.xp + XP_TABLE.buddy_comment;
      const newLevel = calcLevel(newXp);
      await supabase.from('users').update({ xp: newXp, level: newLevel }).eq('id', from_user_id);

      const { count: commentsSent } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('from_user_id', from_user_id);

      const { count: totalCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true)
        .in('goal_id', (
          await supabase.from('goals').select('id').eq('user_id', from_user_id)
        ).data?.map((g: { id: string }) => g.id) || []);

      const earnedBadges = checkBadges({
        totalTasksCompleted: totalCompleted || 0,
        streakCount: sender.streak_count,
        monthlyGoalAchieved: false,
        commentsSent: commentsSent || 0,
        yearlyGoalCompleted: false,
        weeklyAllDone: false,
      });

      for (const badgeType of earnedBadges) {
        await supabase
          .from('badges')
          .upsert(
            { user_id: from_user_id, badge_type: badgeType },
            { onConflict: 'user_id,badge_type', ignoreDuplicates: true }
          );
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
