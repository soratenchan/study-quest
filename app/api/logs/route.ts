import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { XP_TABLE, calcLevel } from '@/lib/utils/xp';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const room_id = request.nextUrl.searchParams.get('room_id');

    if (!room_id) {
      return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('study_logs')
      .select('*, user:users(*)')
      .eq('room_id', room_id)
      .order('created_at', { ascending: false });

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
    const { room_id, user_id, memo, session_date } = body;

    if (!room_id || !user_id || !memo) {
      return NextResponse.json({ error: 'room_id, user_id, and memo are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('study_logs')
      .insert({
        room_id,
        user_id,
        memo,
        session_date: session_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add 5 XP to user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (user && !userError) {
      const newXp = user.xp + XP_TABLE.study_log;
      const newLevel = calcLevel(newXp);

      await supabase
        .from('users')
        .update({ xp: newXp, level: newLevel })
        .eq('id', user_id);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
