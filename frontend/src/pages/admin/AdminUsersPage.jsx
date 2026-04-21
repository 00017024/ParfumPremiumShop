import { useState, useMemo } from 'react';
import { RotateCcw, Search, ShieldOff, ShieldCheck, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
        role === 'admin'
          ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
          : 'bg-neutral-700/50 text-text-muted border border-neutral-600'
      }`}
    >
      {role}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
        isActive
          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
          : 'bg-red-500/15 text-red-400 border border-red-500/30'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isActive ? 'bg-green-400' : 'bg-red-400'
        }`}
        aria-hidden="true"
      />
      {isActive ? t('admin.users.active') : t('admin.users.blocked')}
    </span>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-neutral-border animate-pulse">
      {[160, 180, 130, 80, 80, 90].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3 bg-surface-dark rounded" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── AdminUsersPage ───────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { users, loading, error, togglingId, reload, toggleBlock } = useAdminUsers();

  const [search, setSearch] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
    );
  }, [users, search]);

  const handleToggleConfirm = async () => {
    if (!confirmTarget) return;
    await toggleBlock(confirmTarget._id, confirmTarget.isActive);
    setConfirmTarget(null);
  };

  const COLUMNS = [
    t('admin.users.col_name'),
    t('admin.users.col_email'),
    t('admin.users.col_phone'),
    t('admin.users.col_role'),
    t('admin.users.col_status'),
    t('admin.users.col_actions'),
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-text-primary tracking-wide">
            {t('admin.users.title')}
          </h1>
          {!loading && (
            <p className="text-sm text-text-muted mt-1">
              {t('admin.users.total', { count: users.length })}
            </p>
          )}
        </div>

        <button
          onClick={reload}
          disabled={loading}
          className="self-start flex items-center gap-2 text-xs text-text-muted hover:text-brand-gold transition-colors disabled:opacity-40"
          aria-label={t('admin.users.refresh')}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.users.refresh')}
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          placeholder={t('admin.users.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-card border border-neutral-border rounded-sm pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors"
        />
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-surface-card border border-neutral-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t('admin.users.title')}>
            <thead>
              <tr className="border-b border-neutral-border">
                {COLUMNS.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-text-muted font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : filteredUsers.length === 0
                ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-text-muted"
                    >
                      {search ? t('admin.users.no_match') : t('admin.users.no_users')}
                    </td>
                  </tr>
                )
                : filteredUsers.map((user) => {
                  const isToggling = togglingId === user._id;
                  const joinDate = new Date(user.createdAt).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' }
                  );

                  return (
                    <tr
                      key={user._id}
                      className={`border-b border-neutral-border last:border-0 transition-colors ${
                        isToggling ? 'opacity-50' : 'hover:bg-surface-dark/40'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-text-primary font-medium">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {t('admin.users.joined', { date: joinDate })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary">
                        {user.email}
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary whitespace-nowrap">
                        {user.phone}
                      </td>
                      <td className="px-4 py-3.5">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge isActive={user.isActive} />
                      </td>
                      <td className="px-4 py-3.5">
                        {user.role === 'admin' ? (
                          <span className="text-xs text-text-muted italic">
                            {t('admin.users.protected')}
                          </span>
                        ) : isToggling ? (
                          <Loader2 className="w-4 h-4 text-brand-gold animate-spin" />
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmTarget({
                                _id: user._id,
                                name: user.name,
                                isActive: user.isActive,
                              })
                            }
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm border transition-all ${
                              user.isActive
                                ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                                : 'border-green-500/40 text-green-400 hover:bg-green-500/10'
                            }`}
                            aria-label={
                              user.isActive
                                ? `${t('admin.users.block')} ${user.name}`
                                : `${t('admin.users.unblock')} ${user.name}`
                            }
                          >
                            {user.isActive ? (
                              <>
                                <ShieldOff className="w-3 h-3" aria-hidden="true" />
                                {t('admin.users.block')}
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                                {t('admin.users.unblock')}
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Block/Unblock Confirmation ───────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.isActive ? t('admin.users.block_title') : t('admin.users.unblock_title')}
        description={
          confirmTarget
            ? confirmTarget.isActive
              ? t('admin.users.block_description', { name: confirmTarget.name })
              : t('admin.users.unblock_description', { name: confirmTarget.name })
            : ''
        }
        confirmLabel={confirmTarget?.isActive ? t('admin.users.block_confirm') : t('admin.users.unblock_confirm')}
        loading={Boolean(togglingId)}
        onConfirm={handleToggleConfirm}
        onCancel={() => {
          if (!togglingId) setConfirmTarget(null);
        }}
      />

    </div>
  );
}
