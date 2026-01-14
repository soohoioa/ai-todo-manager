/**
 * Supabase 데이터베이스 타입 정의
 * schema.sql과 동기화되어야 합니다.
 */

/**
 * 데이터베이스 스키마 타입
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          priority: 'low' | 'medium' | 'high';
          category: string[];
          completed: boolean;
          created_date: string;
          due_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          category?: string[];
          completed?: boolean;
          created_date?: string;
          due_date?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high';
          category?: string[];
          completed?: boolean;
          created_date?: string;
          due_date?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      user_todo_stats: {
        Row: {
          user_id: string | null;
          total_todos: number | null;
          completed_todos: number | null;
          active_todos: number | null;
          high_priority_todos: number | null;
          overdue_todos: number | null;
        };
      };
    };
    Functions: {
      create_sample_todos: {
        Args: {
          p_user_id: string;
          p_count?: number;
        };
        Returns: void;
      };
    };
  };
};

/**
 * Supabase 클라이언트 타입
 */
export type SupabaseClient = import('@supabase/supabase-js').SupabaseClient<Database>;

/**
 * 타입 헬퍼
 */
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

/**
 * 테이블 타입 별칭
 */
export type DbUser = Tables<'users'>;
export type DbTodo = Tables<'todos'>;
export type UserTodoStats = Database['public']['Views']['user_todo_stats']['Row'];

