import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証ユーザーを取得
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { room_id, name, avatar } = body;

    if (!room_id || !name || !avatar) {
      return NextResponse.json({ error: 'room_id, name, and avatar are required' }, { status: 400 });
    }

    // 既に同じauth_idのユーザーが存在するか確認
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .eq('room_id', room_id)
      .single();

    if (existing) {
      // 既存ユーザーを返す
      return NextResponse.json(existing, { status: 200 });
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ room_id, name, avatar, auth_id: authUser.id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const room_id = searchParams.get('room_id');
    const id = searchParams.get('id');
    const auth_id = searchParams.get('auth_id');

    if (auth_id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', auth_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    if (id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      // 後方互換: { user: ... } 形式でも返す
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

    return NextResponse.json({ error: 'room_id, id, or auth_id is required' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, avatar } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .eq('auth_id', authUser.id)
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
