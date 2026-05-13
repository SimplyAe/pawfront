const WEBHOOK_URL = process.env.ADMIN_WEBHOOK_URL ?? "";

const ACTION_COLORS: Record<string, number> = {
  badge_assign: 0x57f287,
  badge_revoke: 0xed4245,
};

const ACTION_LABELS: Record<string, string> = {
  badge_assign: "Badge Assigned",
  badge_revoke: "Badge Revoked",
};

export async function sendAdminLog(opts: {
  action: string;
  targetName: string;
  targetId: number;
  adminName: string;
  detail: string;
}): Promise<void> {
  if (!WEBHOOK_URL) return;
  const { action, targetName, targetId, adminName, detail } = opts;
  const label = ACTION_LABELS[action] ?? action;
  const color = ACTION_COLORS[action] ?? 0xffffff;

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Pawtoka Admin",
        embeds: [
          {
            title: `${label} — ${targetName}`,
            color,
            fields: [
              { name: "Target", value: `${targetName} (#${targetId})`, inline: true },
              { name: "By",     value: adminName,                       inline: true },
              { name: "Badge",  value: detail,                          inline: false },
            ],
          },
        ],
      }),
    });
  } catch {
    // non-critical — don't block the action
  }
}
