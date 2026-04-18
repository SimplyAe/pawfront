const API_BASE = "https://api.pawinput.xyz/v1";

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface PlayerInfo {
  id: number;
  name: string;
  safe_name: string;
  priv: number;
  country: string;
  silence_end: number;
  donor_end: number;
  creation_time: number;
  latest_activity: number;
  clan_id: number;
  clan_priv: number;
  preferred_mode: number;
  play_style: number;
  custom_badge_name: string | null;
  custom_badge_icon: string | null;
  userpage_content: string | null;
}

export interface PlayerStats {
  id: number;
  mode: number;
  tscore: number;
  rscore: number;
  pp: number;
  plays: number;
  playtime: number;
  acc: number;
  max_combo: number;
  total_hits: number;
  replay_views: number;
  xh_count: number;
  x_count: number;
  sh_count: number;
  s_count: number;
  a_count: number;
  rank: number;
  country_rank: number;
}

export interface BeatmapInfo {
  md5: string;
  id: number;
  set_id: number;
  artist: string;
  title: string;
  version: string;
  creator: string;
  last_update: string;
  total_length: number;
  max_combo: number;
  status: number;
  plays: number;
  passes: number;
  mode: number;
  bpm: number;
  cs: number;
  ar: number;
  od: number;
  hp: number;
  diff: number;
}

export interface Score {
  id: number;
  map_md5: string;
  score: number;
  pp: number;
  acc: number;
  max_combo: number;
  mods: number;
  n300: number;
  n100: number;
  n50: number;
  nmiss: number;
  ngeki: number;
  nkatu: number;
  grade: string;
  status: number;
  mode: number;
  play_time: string;
  time_elapsed: number;
  perfect: boolean;
  beatmap: BeatmapInfo;
}

export interface LeaderboardEntry {
  player_id: number;
  name: string;
  country: string;
  tscore: number;
  rscore: number;
  pp: number;
  plays: number;
  playtime: number;
  acc: number;
  max_combo: number;
  xh_count: number;
  x_count: number;
  sh_count: number;
  s_count: number;
  a_count: number;
  rank: number;
  country_rank: number;
  clan_id: number;
  clan_name: string | null;
  clan_tag: string | null;
}

export interface MostPlayedMap {
  id: number;
  set_id: number;
  md5: string;
  artist: string;
  title: string;
  version: string;
  creator: string;
  plays: number;
}

export interface PlayerStatus {
  online: boolean;
  login_time?: number;
  status?: number;
  status_text?: string;
  beatmap_md5?: string;
  beatmap_id?: number;
  mode?: number;
  mods?: number;
}

export interface ServerStats {
  total_pp: number;
  submitted_scores: number;
  restricted_count: number;
  latest_player: string;
  top_score_pp: number;
  top_score_player: string;
}

export async function getServerStats(): Promise<ServerStats | null> {
  const data = await apiFetch<{ status: string; stats: ServerStats }>("/get_server_stats");
  return data?.stats ?? null;
}

export async function getPlayerCount(): Promise<{ online: number; total: number } | null> {
  const data = await apiFetch<{ status: string; counts: { online: number; total: number } }>(
    "/get_player_count"
  );
  return data?.counts ?? null;
}

export async function getLeaderboard(
  mode: number,
  sort: string,
  limit: number,
  offset: number,
  country?: string
): Promise<LeaderboardEntry[]> {
  let path = `/get_leaderboard?mode=${mode}&sort=${sort}&limit=${limit}&offset=${offset}`;
  if (country) path += `&country=${country}`;
  const data = await apiFetch<{ status: string; leaderboard: LeaderboardEntry[] }>(path);
  return data?.leaderboard ?? [];
}

export async function getPlayerInfo(
  id: number
): Promise<{ info: PlayerInfo; stats: Record<string, PlayerStats> } | null> {
  const data = await apiFetch<{
    status: string;
    player: { info: PlayerInfo; stats: Record<string, PlayerStats> };
  }>(`/get_player_info?scope=all&id=${id}`);
  return data?.player ?? null;
}

export async function getPlayerScores(
  id: number,
  scope: "best" | "recent",
  mode: number,
  limit: number
): Promise<Score[]> {
  const data = await apiFetch<{ status: string; scores: Score[] }>(
    `/get_player_scores?scope=${scope}&id=${id}&mode=${mode}&limit=${limit}`
  );
  return data?.scores ?? [];
}

export async function getPlayerMostPlayed(
  id: number,
  mode: number,
  limit: number
): Promise<MostPlayedMap[]> {
  const data = await apiFetch<{ status: string; maps: MostPlayedMap[] }>(
    `/get_player_most_played?id=${id}&mode=${mode}&limit=${limit}`
  );
  return data?.maps ?? [];
}

export async function getPlayerStatus(id: number): Promise<PlayerStatus | null> {
  const data = await apiFetch<{ status: string; player_status: PlayerStatus }>(
    `/get_player_status?id=${id}`
  );
  return data?.player_status ?? null;
}

export async function searchPlayers(query: string): Promise<{ id: number; name: string }[]> {
  const data = await apiFetch<{ status: string; result: { id: number; name: string }[] }>(
    `/search_players?q=${encodeURIComponent(query)}`
  );
  return data?.result ?? [];
}

export function avatarUrl(userId: number): string {
  return `http://a.pawinput.xyz/${userId}`;
}

export async function getMapInfo(id: number): Promise<BeatmapInfo | null> {
  const data = await apiFetch<{ status: string; map: BeatmapInfo }>(`/get_map_info?id=${id}`);
  return data?.map ?? null;
}

export async function getMapScores(
  id: number,
  mode: number,
  limit = 50
): Promise<Score[]> {
  const data = await apiFetch<{ status: string; scores: Score[] }>(
    `/get_map_scores?scope=best&id=${id}&mode=${mode}&limit=${limit}`
  );
  return data?.scores ?? [];
}

export async function getBeatmapset(setId: number): Promise<BeatmapInfo[]> {
  const data = await apiFetch<{ status: string; maps: BeatmapInfo[] }>(
    `/get_beatmapset?set_id=${setId}`
  );
  return data?.maps ?? [];
}

export interface BeatmapsetDiff {
  id: number;
  version: string;
  diff: number;
  mode: number;
}

export interface BeatmapsetCard {
  id: number;
  set_id: number;
  status: number;
  artist: string;
  title: string;
  creator: string;
  mode: number;
  plays: number;
  diffs: BeatmapsetDiff[];
}

export async function getBeatmaps(params: {
  q?: string;
  status?: number;
  mode?: number;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; beatmapsets: BeatmapsetCard[] }> {
  const qs = new URLSearchParams();
  if (params.q)                 qs.set("q",      params.q);
  if (params.status != null)    qs.set("status", String(params.status));
  if (params.mode   != null)    qs.set("mode",   String(params.mode));
  if (params.sort)              qs.set("sort",   params.sort);
  if (params.page)              qs.set("page",   String(params.page));
  if (params.limit)             qs.set("limit",  String(params.limit));
  const data = await apiFetch<{ status: string; total: number; beatmapsets: BeatmapsetCard[] }>(
    `/get_beatmaps?${qs.toString()}`
  );
  return { total: data?.total ?? 0, beatmapsets: data?.beatmapsets ?? [] };
}

export interface ClanEntry {
  id: number;
  name: string;
  tag: string;
  owner_name: string;
  member_count: number;
  total_pp: number;
  total_rscore: number;
  created_at: string | null;
}

export interface ClanMember {
  id: number;
  name: string;
  country: string;
  clan_priv: number;
  pp: number;
  acc: number;
  rscore: number;
  plays: number;
}

export interface ClanDetail {
  id: number;
  name: string;
  tag: string;
  description: string | null;
  created_at: string | null;
  owner_id: number;
  owner_name: string;
}

export interface ClanInvite {
  id: number;
  clan_id: number;
  clan_name: string;
  clan_tag: string;
  inviter_name: string;
  created_at: string | null;
}

export async function getClanInvites(userId: number): Promise<ClanInvite[]> {
  const data = await apiFetch<{ status: string; invites: ClanInvite[] }>(
    `/get_clan_invites?user_id=${userId}`
  );
  return data?.invites ?? [];
}

export async function getClan(id: number, mode = 0): Promise<{ clan: ClanDetail; members: ClanMember[] } | null> {
  const data = await apiFetch<{ status: string; clan: ClanDetail; members: ClanMember[] }>(
    `/get_clan?id=${id}&mode=${mode}`
  );
  if (!data || data.status !== "success") return null;
  return { clan: data.clan, members: data.members };
}

export async function getClans(params: {
  mode?: number;
  page?: number;
  limit?: number;
}): Promise<{ total: number; clans: ClanEntry[] }> {
  const qs = new URLSearchParams();
  if (params.mode  != null) qs.set("mode",  String(params.mode));
  if (params.page  != null) qs.set("page",  String(params.page));
  if (params.limit != null) qs.set("limit", String(params.limit));
  const data = await apiFetch<{ status: string; total: number; clans: ClanEntry[] }>(
    `/get_clans?${qs.toString()}`
  );
  return { total: data?.total ?? 0, clans: data?.clans ?? [] };
}

export interface RecentScore {
  id: number;
  userid: number;
  player_name: string;
  pp: number;
  acc: number;
  score: number;
  mode: number;
  grade: string;
  max_combo: number;
  mods: number;
  play_time: string | null;
  map_id: number;
  title: string;
  artist: string;
  version: string;
  set_id: number;
  diff: number;
}

export async function getRecentScores(limit = 20): Promise<RecentScore[]> {
  const data = await apiFetch<{ status: string; scores: RecentScore[] }>(
    `/get_recent_scores?limit=${limit}`
  );
  return data?.scores ?? [];
}

export function beatmapCoverUrl(setId: number): string {
  return `https://assets.ppy.sh/beatmaps/${setId}/covers/card.jpg`;
}

export function beatmapBannerUrl(setId: number): string {
  return `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg`;
}
