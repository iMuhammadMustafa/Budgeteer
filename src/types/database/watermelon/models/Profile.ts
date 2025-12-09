import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export default class Profile extends Model {
  static table = "profiles";

  @field("email") email?: string;
  @field("full_name") fullName?: string;
  @field("avatar_url") avatarUrl?: string;
  @field("timezone") timezone?: string;
  @field("tenant_id") tenantId?: string;

  @readonly @date("updated_at") updatedAt!: Date;
}

export type ProfileModel = Profile;
