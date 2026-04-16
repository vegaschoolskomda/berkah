import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ActivityHistoryItem = {
  path: string;
  pageTitle: string;
  visitedAt: string;
};

type UserLiveState = {
  userId: number;
  userName: string;
  userEmail: string;
  roleName: string;
  currentPath: string;
  currentPageTitle: string;
  lastSeenAt: string;
  history: ActivityHistoryItem[];
};

const MAX_HISTORY_PER_USER = 200;
const ONLINE_THRESHOLD_MS = 90_000;

@Injectable()
export class EmployeeMonitoringService {
  private liveStates = new Map<number, UserLiveState>();

  constructor(private readonly prisma: PrismaService) {}

  private isManagerRoleName(roleName?: string | null): boolean {
    if (!roleName) return false;
    const n = roleName.toLowerCase();
    return (
      n === 'admin' ||
      n === 'owner' ||
      n === 'pemilik' ||
      n.includes('manajer') ||
      n.includes('manager') ||
      n.includes('supervisor') ||
      n.includes('kepala')
    );
  }

  private normalizePath(path: string): string {
    const raw = String(path || '').trim();
    if (!raw) return '/';
    if (raw.startsWith('/')) return raw;
    return `/${raw}`;
  }

  private toReadableTitle(path: string): string {
    if (path === '/') return 'Dashboard';
    return path
      .split('?')[0]
      .split('/')
      .filter(Boolean)
      .map((segment) => segment.replace(/[-_]/g, ' '))
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' / ') || 'Halaman';
  }

  async ping(userId: number, payload: { path: string; pageTitle?: string | null }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const nowIso = new Date().toISOString();
    const path = this.normalizePath(payload.path);
    const pageTitle = String(payload.pageTitle || '').trim() || this.toReadableTitle(path);

    const existing = this.liveStates.get(user.id);

    if (!existing) {
      this.liveStates.set(user.id, {
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        roleName: user.role?.name || '-',
        currentPath: path,
        currentPageTitle: pageTitle,
        lastSeenAt: nowIso,
        history: [{ path, pageTitle, visitedAt: nowIso }],
      });
      return { ok: true };
    }

    const isPathChanged = existing.currentPath !== path;
    if (isPathChanged) {
      existing.history.unshift({ path, pageTitle, visitedAt: nowIso });
      if (existing.history.length > MAX_HISTORY_PER_USER) {
        existing.history = existing.history.slice(0, MAX_HISTORY_PER_USER);
      }
      existing.currentPath = path;
      existing.currentPageTitle = pageTitle;
    }

    existing.userName = user.name || user.email;
    existing.userEmail = user.email;
    existing.roleName = user.role?.name || '-';
    existing.lastSeenAt = nowIso;

    return { ok: true };
  }

  async getEmployeeStates() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const employees = users.filter((user) => !this.isManagerRoleName(user.role?.name));

    const items = employees.map((user) => {
      const state = this.liveStates.get(user.id);
      const lastSeenAt = state?.lastSeenAt || null;
      const isOnline = lastSeenAt ? (Date.now() - new Date(lastSeenAt).getTime()) <= ONLINE_THRESHOLD_MS : false;

      return {
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        roleName: user.role?.name || 'Tanpa Role',
        currentPath: state?.currentPath || null,
        currentPageTitle: state?.currentPageTitle || null,
        lastSeenAt,
        isOnline,
        historyCount: state?.history.length || 0,
      };
    });

    return items.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.userName.localeCompare(b.userName, 'id');
    });
  }

  async getEmployeeHistory(userId: number, limit = 100) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    if (this.isManagerRoleName(user.role?.name)) {
      throw new NotFoundException('Data karyawan tidak ditemukan');
    }

    const state = this.liveStates.get(user.id);
    const lastSeenAt = state?.lastSeenAt || null;
    const isOnline = lastSeenAt ? (Date.now() - new Date(lastSeenAt).getTime()) <= ONLINE_THRESHOLD_MS : false;
    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));

    return {
      user: {
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        roleName: user.role?.name || 'Tanpa Role',
      },
      currentPath: state?.currentPath || null,
      currentPageTitle: state?.currentPageTitle || null,
      lastSeenAt,
      isOnline,
      history: (state?.history || []).slice(0, safeLimit),
    };
  }
}
