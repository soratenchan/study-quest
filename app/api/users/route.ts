import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { room_id, name, avatar } = body;

    if (!room_id || !name || !avatar) {
      return NextResponse.json({ error: 'room_id, name, and avatar are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ room_id, name, avatar })
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

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const room_id = searchParams.get('room_id');
    const id = searchParams.get('id');

    if (id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    if (room_id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('room_id', room_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'room_id or id is required' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
