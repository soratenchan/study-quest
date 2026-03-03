import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user_id = request.nextUrl.searchParams.get('user_id');
    const room_id = request.nextUrl.searchParams.get('room_id');

    const id = request.nextUrl.searchParams.get('id');
    if (id) {
      const { data, error } = await supabase
        .from('goals')
        .select('*, tasks(*)')
        .eq('id', id)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 404 });
      return NextResponse.json(data);
    }

    if (room_id) {
      // ルーム内の全ユーザーの目標を取得
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('room_id', room_id);

      const userIds = users?.map((u: { id: string }) => u.id) || [];

      const { data, error } = await supabase
        .from('goals')
        .select('*, tasks(*)')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    if (!user_id) {
      return NextResponse.json({ error: 'user_id or room_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*, tasks(*)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

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
    const { user_id, title, description, year, is_public } = body;

    if (!user_id || !title || !year) {
      return NextResponse.json({ error: 'user_id, title, and year are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id,
        title,
        description: description || null,
        year,
        is_public: is_public !== undefined ? is_public : true,
      })
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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, title, description, is_public } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (is_public !== undefined) updates.is_public = is_public;

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
