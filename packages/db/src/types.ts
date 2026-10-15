
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "ai_calls": {
                  Row: {
                    "created_at": string | null,"id": string,"job": string,"latency_ms": number,"model": string,"prompt_version": string,"status": string,"token_counts": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"job": string,"latency_ms": number,"model": string,"prompt_version": string,"status": string,"token_counts"?: Json | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"job"?: string,"latency_ms"?: number,"model"?: string,"prompt_version"?: string,"status"?: string,"token_counts"?: Json | null
                  }
                  Relationships: [
                    
                  ]
                },"ai_feedback": {
                  Row: {
                    "created_at": string | null,"id": string,"rating": number,"target_id": string,"target_kind": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"rating": number,"target_id": string,"target_kind": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"rating"?: number,"target_id"?: string,"target_kind"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"ai_usage_daily": {
                  Row: {
                    "id": string,"prep_count": number | null,"reply_helper_count": number | null,"turn_count": number | null,"updated_at": string | null,"usage_date": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"prep_count"?: number | null,"reply_helper_count"?: number | null,"turn_count"?: number | null,"updated_at"?: string | null,"usage_date": string,"user_id": string
                  }
                  Update: {
                    "id"?: string,"prep_count"?: number | null,"reply_helper_count"?: number | null,"turn_count"?: number | null,"updated_at"?: string | null,"usage_date"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"attempts": {
                  Row: {
                    "created_at": string | null,"ended_at": string | null,"ended_reason": string | null,"id": string,"mode": string,"parent_attempt_id": string | null,"persona_id": string | null,"session_id": string | null,"state": NonNullable<Json>,"turns_count": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"ended_at"?: string | null,"ended_reason"?: string | null,"id"?: string,"mode": string,"parent_attempt_id"?: string | null,"persona_id"?: string | null,"session_id"?: string | null,"state"?: NonNullable<Json>,"turns_count"?: number,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"ended_at"?: string | null,"ended_reason"?: string | null,"id"?: string,"mode"?: string,"parent_attempt_id"?: string | null,"persona_id"?: string | null,"session_id"?: string | null,"state"?: NonNullable<Json>,"turns_count"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attempts_parent_attempt_id_fkey"
      columns: ["parent_attempt_id"]
isOneToOne: false
      referencedRelation: "attempts"
      referencedColumns: ["id"]
    }
                  ]
                },"coach_feedback": {
                  Row: {
                    "attempt_id": string,"created_at": string | null,"id": string,"judge": Json | null,"model": string,"payload": NonNullable<Json>,"prompt_version": string,"verified": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "attempt_id": string,"created_at"?: string | null,"id"?: string,"judge"?: Json | null,"model": string,"payload": NonNullable<Json>,"prompt_version": string,"verified"?: boolean
                  }
                  Update: {
                    "attempt_id"?: string,"created_at"?: string | null,"id"?: string,"judge"?: Json | null,"model"?: string,"payload"?: NonNullable<Json>,"prompt_version"?: string,"verified"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "coach_feedback_attempt_id_fkey"
      columns: ["attempt_id"]
isOneToOne: false
      referencedRelation: "attempts"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "granted": boolean,"id": string,"kind": string,"updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "granted": boolean,"id"?: string,"kind": string,"updated_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "granted"?: boolean,"id"?: string,"kind"?: string,"updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"debriefs": {
                  Row: {
                    "created_at": string | null,"id": string,"moment_id": string | null,"takeaway": string | null,"transcript": Json | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"moment_id"?: string | null,"takeaway"?: string | null,"transcript"?: Json | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"moment_id"?: string | null,"takeaway"?: string | null,"transcript"?: Json | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "debriefs_moment_id_fkey"
      columns: ["moment_id"]
isOneToOne: false
      referencedRelation: "moments"
      referencedColumns: ["id"]
    }
                  ]
                },"deletion_requests": {
                  Row: {
                    "completed_at": string | null,"id": string,"requested_at": string | null,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"id"?: string,"requested_at"?: string | null,"status"?: string,"user_id": string
                  }
                  Update: {
                    "completed_at"?: string | null,"id"?: string,"requested_at"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"energy_checkins": {
                  Row: {
                    "battery_level": number,"created_at": string | null,"id": string,"tags": Json | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "battery_level": number,"created_at"?: string | null,"id"?: string,"tags"?: Json | null,"user_id": string
                  }
                  Update: {
                    "battery_level"?: number,"created_at"?: string | null,"id"?: string,"tags"?: Json | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"entitlements": {
                  Row: {
                    "expires_at": string | null,"id": string,"is_active": boolean | null,"plan": string,"updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "expires_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"plan"?: string,"updated_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "expires_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"plan"?: string,"updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"exports": {
                  Row: {
                    "created_at": string | null,"download_link": string | null,"expires_at": string | null,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"download_link"?: string | null,"expires_at"?: string | null,"id"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"download_link"?: string | null,"expires_at"?: string | null,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"journal_entries": {
                  Row: {
                    "body": string | null,"created_at": string | null,"entry_kind": string,"favorite": boolean | null,"id": string,"metadata": Json | null,"title": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string | null,"entry_kind": string,"favorite"?: boolean | null,"id"?: string,"metadata"?: Json | null,"title"?: string | null,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string | null,"entry_kind"?: string,"favorite"?: boolean | null,"id"?: string,"metadata"?: Json | null,"title"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"ladder_rungs": {
                  Row: {
                    "completed": boolean | null,"completed_at": string | null,"created_at": string | null,"id": string,"sort_order": number,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed"?: boolean | null,"completed_at"?: string | null,"created_at"?: string | null,"id"?: string,"sort_order": number,"title": string,"user_id": string
                  }
                  Update: {
                    "completed"?: boolean | null,"completed_at"?: string | null,"created_at"?: string | null,"id"?: string,"sort_order"?: number,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"micro_reps": {
                  Row: {
                    "actual_drain": number | null,"actual_warmth": number | null,"created_at": string | null,"forecast_drain": number | null,"forecast_warmth": number | null,"id": string,"landed": boolean | null,"moment_id": string | null,"outcome": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actual_drain"?: number | null,"actual_warmth"?: number | null,"created_at"?: string | null,"forecast_drain"?: number | null,"forecast_warmth"?: number | null,"id"?: string,"landed"?: boolean | null,"moment_id"?: string | null,"outcome"?: string | null,"user_id": string
                  }
                  Update: {
                    "actual_drain"?: number | null,"actual_warmth"?: number | null,"created_at"?: string | null,"forecast_drain"?: number | null,"forecast_warmth"?: number | null,"id"?: string,"landed"?: boolean | null,"moment_id"?: string | null,"outcome"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "micro_reps_moment_id_fkey"
      columns: ["moment_id"]
isOneToOne: false
      referencedRelation: "moments"
      referencedColumns: ["id"]
    }
                  ]
                },"moments": {
                  Row: {
                    "created_at": string | null,"description": string | null,"event_date": string | null,"id": string,"prep_payload": Json | null,"status": string | null,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"event_date"?: string | null,"id"?: string,"prep_payload"?: Json | null,"status"?: string | null,"title": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"event_date"?: string | null,"id"?: string,"prep_payload"?: Json | null,"status"?: string | null,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notification_prefs": {
                  Row: {
                    "id": string,"paused_until": string | null,"push_token": string | null,"quiet_hours_end": string | null,"quiet_hours_start": string | null,"toggles": Json | null,"updated_at": string | null,"user_id": string,"window_end": string | null,"window_start": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"paused_until"?: string | null,"push_token"?: string | null,"quiet_hours_end"?: string | null,"quiet_hours_start"?: string | null,"toggles"?: Json | null,"updated_at"?: string | null,"user_id": string,"window_end"?: string | null,"window_start"?: string | null
                  }
                  Update: {
                    "id"?: string,"paused_until"?: string | null,"push_token"?: string | null,"quiet_hours_end"?: string | null,"quiet_hours_start"?: string | null,"toggles"?: Json | null,"updated_at"?: string | null,"user_id"?: string,"window_end"?: string | null,"window_start"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"playbooks": {
                  Row: {
                    "answers": NonNullable<Json>,"created_at": string | null,"derived": NonNullable<Json>,"id": string,"updated_at": string | null,"user_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"created_at"?: string | null,"derived"?: NonNullable<Json>,"id"?: string,"updated_at"?: string | null,"user_id": string,"version"?: number
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"created_at"?: string | null,"derived"?: NonNullable<Json>,"id"?: string,"updated_at"?: string | null,"user_id"?: string,"version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "adult_confirmed_at": string | null,"created_at": string | null,"display_name": string | null,"locale": string | null,"theme_pref": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "adult_confirmed_at"?: string | null,"created_at"?: string | null,"display_name"?: string | null,"locale"?: string | null,"theme_pref"?: string | null,"user_id": string
                  }
                  Update: {
                    "adult_confirmed_at"?: string | null,"created_at"?: string | null,"display_name"?: string | null,"locale"?: string | null,"theme_pref"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"safety_events": {
                  Row: {
                    "created_at": string | null,"id": string,"kind": string,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"kind": string,"source": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"kind"?: string,"source"?: string
                  }
                  Relationships: [
                    
                  ]
                },"sessions_log": {
                  Row: {
                    "completed_at": string | null,"id": string,"mode": string,"session_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"id"?: string,"mode"?: string,"session_id": string,"user_id": string
                  }
                  Update: {
                    "completed_at"?: string | null,"id"?: string,"mode"?: string,"session_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"skills_progress": {
                  Row: {
                    "id": string,"skill_key": string,"stage": string,"stage_history": NonNullable<Json>,"updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"skill_key": string,"stage": string,"stage_history"?: NonNullable<Json>,"updated_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "id"?: string,"skill_key"?: string,"stage"?: string,"stage_history"?: NonNullable<Json>,"updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"turns": {
                  Row: {
                    "attempt_id": string,"created_at": string | null,"expires_at": string | null,"id": string,"idx": number,"mood": Json | null,"role": string,"text": string,"thought": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attempt_id": string,"created_at"?: string | null,"expires_at"?: string | null,"id"?: string,"idx": number,"mood"?: Json | null,"role": string,"text": string,"thought"?: string | null
                  }
                  Update: {
                    "attempt_id"?: string,"created_at"?: string | null,"expires_at"?: string | null,"id"?: string,"idx"?: number,"mood"?: Json | null,"role"?: string,"text"?: string,"thought"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "turns_attempt_id_fkey"
      columns: ["attempt_id"]
isOneToOne: false
      referencedRelation: "attempts"
      referencedColumns: ["id"]
    }
                  ]
                },"weekly_letters": {
                  Row: {
                    "content": string,"created_at": string | null,"id": string,"metadata": Json | null,"user_id": string,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"created_at"?: string | null,"id"?: string,"metadata"?: Json | null,"user_id": string,"week_start": string
                  }
                  Update: {
                    "content"?: string,"created_at"?: string | null,"id"?: string,"metadata"?: Json | null,"user_id"?: string,"week_start"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "purge_expired_text":
{ Args: Record<PropertyKey, never>; Returns: number
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const


// Domain model type aliases
export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

export type Consent = Tables<'consents'>;
export type ConsentInsert = TablesInsert<'consents'>;
export type ConsentUpdate = TablesUpdate<'consents'>;

export type Playbook = Tables<'playbooks'>;
export type PlaybookInsert = TablesInsert<'playbooks'>;
export type PlaybookUpdate = TablesUpdate<'playbooks'>;

export type SkillsProgress = Tables<'skills_progress'>;
export type SkillsProgressInsert = TablesInsert<'skills_progress'>;
export type SkillsProgressUpdate = TablesUpdate<'skills_progress'>;

export type SessionLog = Tables<'sessions_log'>;
export type SessionLogInsert = TablesInsert<'sessions_log'>;
export type SessionLogUpdate = TablesUpdate<'sessions_log'>;

export type Attempt = Tables<'attempts'>;
export type AttemptInsert = TablesInsert<'attempts'>;
export type AttemptUpdate = TablesUpdate<'attempts'>;

export type Turn = Tables<'turns'>;
export type TurnInsert = TablesInsert<'turns'>;
export type TurnUpdate = TablesUpdate<'turns'>;

export type CoachFeedback = Tables<'coach_feedback'>;
export type CoachFeedbackInsert = TablesInsert<'coach_feedback'>;
export type CoachFeedbackUpdate = TablesUpdate<'coach_feedback'>;

export type AiFeedback = Tables<'ai_feedback'>;
export type AiFeedbackInsert = TablesInsert<'ai_feedback'>;
export type AiFeedbackUpdate = TablesUpdate<'ai_feedback'>;

export type Moment = Tables<'moments'>;
export type MomentInsert = TablesInsert<'moments'>;
export type MomentUpdate = TablesUpdate<'moments'>;

export type EnergyCheckin = Tables<'energy_checkins'>;
export type EnergyCheckinInsert = TablesInsert<'energy_checkins'>;
export type EnergyCheckinUpdate = TablesUpdate<'energy_checkins'>;

export type MicroRep = Tables<'micro_reps'>;
export type MicroRepInsert = TablesInsert<'micro_reps'>;
export type MicroRepUpdate = TablesUpdate<'micro_reps'>;

export type Debrief = Tables<'debriefs'>;
export type DebriefInsert = TablesInsert<'debriefs'>;
export type DebriefUpdate = TablesUpdate<'debriefs'>;

export type LadderRung = Tables<'ladder_rungs'>;
export type LadderRungInsert = TablesInsert<'ladder_rungs'>;
export type LadderRungUpdate = TablesUpdate<'ladder_rungs'>;

export type JournalEntry = Tables<'journal_entries'>;
export type JournalEntryInsert = TablesInsert<'journal_entries'>;
export type JournalEntryUpdate = TablesUpdate<'journal_entries'>;

export type WeeklyLetter = Tables<'weekly_letters'>;
export type WeeklyLetterInsert = TablesInsert<'weekly_letters'>;
export type WeeklyLetterUpdate = TablesUpdate<'weekly_letters'>;

export type NotificationPrefs = Tables<'notification_prefs'>;
export type NotificationPrefsInsert = TablesInsert<'notification_prefs'>;
export type NotificationPrefsUpdate = TablesUpdate<'notification_prefs'>;

export type Entitlement = Tables<'entitlements'>;
export type EntitlementInsert = TablesInsert<'entitlements'>;
export type EntitlementUpdate = TablesUpdate<'entitlements'>;

export type AiCall = Tables<'ai_calls'>;
export type AiCallInsert = TablesInsert<'ai_calls'>;
export type AiCallUpdate = TablesUpdate<'ai_calls'>;

export type SafetyEvent = Tables<'safety_events'>;
export type SafetyEventInsert = TablesInsert<'safety_events'>;
export type SafetyEventUpdate = TablesUpdate<'safety_events'>;

export type AiUsageDaily = Tables<'ai_usage_daily'>;
export type AiUsageDailyInsert = TablesInsert<'ai_usage_daily'>;
export type AiUsageDailyUpdate = TablesUpdate<'ai_usage_daily'>;

export type DeletionRequest = Tables<'deletion_requests'>;
export type DeletionRequestInsert = TablesInsert<'deletion_requests'>;
export type DeletionRequestUpdate = TablesUpdate<'deletion_requests'>;

export type ExportRecord = Tables<'exports'>;
export type ExportRecordInsert = TablesInsert<'exports'>;
export type ExportRecordUpdate = TablesUpdate<'exports'>;
