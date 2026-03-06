import { db } from "./db/index.js";
import { monitors } from "./db/schema.js";
import { checksQueue } from "./queue.js";

const trackers = new Map<number, NodeJS.Timeout>();

async function scheduleMonitor(monitor: { id: number; url: string; interval: number }) {
  if (trackers.has(monitor.id)) {
    clearInterval(trackers.get(monitor.id)!);
  }

  const enqueue = () => {
    checksQueue.add("check", { monitorId: monitor.id, url: monitor.url });
  };

  enqueue();
  const timer = setInterval(enqueue, monitor.interval * 1000);
  trackers.set(monitor.id, timer);
}

export async function startScheduler() {
  const allMonitors = await db.select().from(monitors);
  for (const monitor of allMonitors) {
    await scheduleMonitor(monitor);
  }
  console.log(`Scheduler started for ${allMonitors.length} monitors`);

  // Re-sync every 30s to pick up new/deleted monitors
  setInterval(async () => {
    const current = await db.select().from(monitors);
    const currentIds = new Set(current.map((m) => m.id));

    // Remove trackers for deleted monitors
    for (const id of trackers.keys()) {
      if (!currentIds.has(id)) {
        clearInterval(trackers.get(id)!);
        trackers.delete(id);
      }
    }

    // Add trackers for new monitors
    for (const monitor of current) {
      if (!trackers.has(monitor.id)) {
        await scheduleMonitor(monitor);
      }
    }
  }, 30_000);
}
