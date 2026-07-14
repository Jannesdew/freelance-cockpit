import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const PROJECT_COVERS_BUCKET = "project-covers";

export async function uploadProjectCover(
  client: SupabaseClient<Database>,
  file: File
): Promise<string> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage
    .from(PROJECT_COVERS_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = client.storage.from(PROJECT_COVERS_BUCKET).getPublicUrl(path);

  return publicUrl;
}
