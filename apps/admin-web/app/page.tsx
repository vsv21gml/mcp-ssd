"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Group,
  LoadingOverlay,
  Menu,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Select,
  Avatar
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useClientsStore } from "../src/store/useClientsStore";
import {
  captureTokenFromUrl,
  clearAccessToken,
  fetchMe,
  redirectToSso,
  fetchAuditLogs,
  fetchAccessLogs,
  logout,
  type AuditLog,
  type AccessLog
} from "../src/lib/api";

interface EditorState {
  clientId: string;
  clientSecret: string;
  metadata: string;
}

const emptyEditor: EditorState = {
  clientId: "",
  clientSecret: "",
  metadata: "{}"
};

type Section = "clients" | "users" | "audit" | "access";

export default function AdminPage() {
  const { items, users, loading, fetchAll, create, update, remove, updateRole } = useClientsStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditorState>(emptyEditor);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [me, setMe] = useState<{ id?: string | null; name?: string | null; email?: string | null; role?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [section, setSection] = useState<Section>("clients");
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    captureTokenFromUrl();
    fetchMe()
      .then((user) => {
        setMe(user);
        return fetchAll();
      })
      .catch(() => {
        redirectToSso();
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, [fetchAll]);

  useEffect(() => {
    if (section !== "audit" && section !== "access") return;
    setLogsLoading(true);
    const task =
      section === "audit"
        ? fetchAuditLogs(1, 50).then((data) => setAuditLogs(data.items || []))
        : fetchAccessLogs(1, 50).then((data) => setAccessLogs(data.items || []));
    task.catch(() => {
      notifications.show({ message: "Failed to load logs", color: "red" });
    }).finally(() => setLogsLoading(false));
  }, [section]);

  const handleSave = async () => {
    try {
      const metadata = JSON.parse(editing.metadata || "{}");
      if (editingId) {
        await update(editingId, {
          clientSecret: editing.clientSecret || undefined,
          metadata
        });
      } else {
        await create({
          clientId: editing.clientId,
          clientSecret: editing.clientSecret || undefined,
          metadata
        });
      }
      setModalOpen(false);
      setEditing(emptyEditor);
      setEditingId(null);
      notifications.show({ message: "Saved" });
    } catch (error) {
      notifications.show({ message: "Invalid JSON or request failed", color: "red" });
    }
  };

  const handleEdit = (client: any) => {
    setEditing({
      clientId: client.clientId,
      clientSecret: client.clientSecret || "",
      metadata: JSON.stringify(client.metadata || {}, null, 2)
    });
    setEditingId(client.clientId);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditing(emptyEditor);
    setEditingId(null);
    setModalOpen(true);
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const toggleAllClients = (checked: boolean) => {
    if (!checked) {
      setSelectedClientIds(new Set());
      return;
    }
    setSelectedClientIds(new Set(items.map((client) => client.clientId)));
  };

  const handleBulkDelete = async () => {
    const targets = Array.from(selectedClientIds);
    if (targets.length === 0) return;
    if (!window.confirm(`Delete ${targets.length} selected client(s)?`)) return;
    for (const clientId of targets) {
      await remove(clientId);
    }
    setSelectedClientIds(new Set());
  };

  return (
    <>
      <LoadingOverlay visible={authLoading} />
      <header className="sdisk-app-header">
        <div className="sdisk-app-header-inner">
          <div className="sdisk-topbar-title">
            <div className="sdisk-title">Samsung Shared Disk</div>
          </div>
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <Button variant="subtle" className="sdisk-profile-btn">
                <Group gap="sm">
                  <Avatar radius="xl" size="sm" color="samsung">
                    {(me?.name || me?.email || "A").charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ textAlign: "left" }}>
                    <Text size="sm" fw={600}>
                      {me?.name || me?.email || "Admin"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {me?.email || "SSO account"}
                    </Text>
                  </div>
                </Group>
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                color="red"
                onClick={async () => {
                  await logout();
                  clearAccessToken();
                  redirectToSso();
                }}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </header>

      <main className="admin-main">
        <aside className="admin-sidebar">
          <div
            className={`admin-side-link ${section === "clients" ? "active" : ""}`}
            onClick={() => setSection("clients")}
          >
            Clients
          </div>
          <div
            className={`admin-side-link ${section === "users" ? "active" : ""}`}
            onClick={() => setSection("users")}
          >
            Users
          </div>
          <div
            className={`admin-side-link ${section === "audit" ? "active" : ""}`}
            onClick={() => setSection("audit")}
          >
            Audit Logs
          </div>
          <div
            className={`admin-side-link ${section === "access" ? "active" : ""}`}
            onClick={() => setSection("access")}
          >
            Access Logs
          </div>
        </aside>

        <div className="admin-shell">
          <section className="admin-content">
            {section === "clients" && (
              <>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Registered Clients</Text>
                  <Group gap="sm">
                    <Button variant="light" color="red" onClick={handleBulkDelete} disabled={selectedClientIds.size === 0}>
                      Delete
                    </Button>
                    <Button onClick={handleCreate}>New Client</Button>
                  </Group>
                </Group>

                <div style={{ position: "relative" }}>
                  <LoadingOverlay visible={!authLoading && loading} />
                  <Table withRowBorders highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        <Checkbox
                          checked={items.length > 0 && selectedClientIds.size === items.length}
                          indeterminate={selectedClientIds.size > 0 && selectedClientIds.size < items.length}
                          onChange={(event) => toggleAllClients(event.currentTarget.checked)}
                          aria-label="Select all clients"
                        />
                      </Table.Th>
                      <Table.Th>Client ID</Table.Th>
                      <Table.Th>Secret</Table.Th>
                      <Table.Th>Redirect URIs</Table.Th>
                      <Table.Th>Updated</Table.Th>
                      <Table.Th></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                    {items.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text size="sm" c="dimmed">
                            No clients
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                    {items.map((client) => (
                      <Table.Tr key={client.clientId}>
                        <Table.Td>
                          <Checkbox
                            checked={selectedClientIds.has(client.clientId)}
                            onChange={() => toggleClientSelection(client.clientId)}
                            aria-label={`Select ${client.clientId}`}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Button variant="subtle" size="xs" onClick={() => handleEdit(client)}>
                            {client.clientId}
                          </Button>
                        </Table.Td>
                          <Table.Td>
                            {client.clientSecret ? <Badge color="samsung">Stored</Badge> : "-"}
                          </Table.Td>
                          <Table.Td style={{ maxWidth: 260 }}>
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {(client.metadata?.redirect_uris || []).join(", ") || "-"}
                            </Text>
                          </Table.Td>
                          <Table.Td>{new Date(client.updatedAt).toLocaleString()}</Table.Td>
                          <Table.Td></Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </>
            )}

            {section === "users" && (
              <>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>User Roles</Text>
                </Group>

                <div style={{ position: "relative" }}>
                  <LoadingOverlay visible={!authLoading && loading} />
                  <Table withRowBorders highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Role</Table.Th>
                        <Table.Th></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {users.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={4}>
                            <Text size="sm" c="dimmed">
                              No users
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                      {users.map((user) => (
                        <Table.Tr key={user.id}>
                          <Table.Td>{user.name || user.id}</Table.Td>
                          <Table.Td>{user.email || "-"}</Table.Td>
                          <Table.Td>
                            <Select
                              data={[
                                { value: "ADMIN", label: "Admin" },
                                { value: "MEMBER", label: "Member" }
                              ]}
                              value={user.role}
                              onChange={(value) => {
                                if (!value) return;
                                updateRole(user.id, value as "ADMIN" | "MEMBER").catch(() => {
                                  notifications.show({ message: "Update failed", color: "red" });
                                });
                              }}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {user.id === me?.id ? "You" : ""}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </>
            )}

            {section === "audit" && (
              <>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Audit Logs</Text>
                </Group>

                <div style={{ position: "relative" }}>
                  <LoadingOverlay visible={logsLoading} />
                  <Table withRowBorders highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Time</Table.Th>
                        <Table.Th>Actor</Table.Th>
                        <Table.Th>Action</Table.Th>
                        <Table.Th>Target</Table.Th>
                        <Table.Th>Source</Table.Th>
                        <Table.Th>IP</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {auditLogs.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={6}>
                            <Text size="sm" c="dimmed">
                              No audit logs
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                      {auditLogs.map((log) => (
                        <Table.Tr key={log.id}>
                          <Table.Td>{new Date(log.createdAt).toLocaleString()}</Table.Td>
                          <Table.Td>{log.actorEmail || log.actorId}</Table.Td>
                          <Table.Td>{log.action}</Table.Td>
                          <Table.Td>{log.targetId || "-"}</Table.Td>
                          <Table.Td>{log.source || "-"}</Table.Td>
                          <Table.Td>{log.ip || "-"}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </>
            )}

            {section === "access" && (
              <>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Access Logs</Text>
                </Group>

                <div style={{ position: "relative" }}>
                  <LoadingOverlay visible={logsLoading} />
                  <Table withRowBorders highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Time</Table.Th>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Action</Table.Th>
                        <Table.Th>Provider</Table.Th>
                        <Table.Th>IP</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {accessLogs.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={5}>
                            <Text size="sm" c="dimmed">
                              No access logs
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                      {accessLogs.map((log) => (
                        <Table.Tr key={log.id}>
                          <Table.Td>{new Date(log.createdAt).toLocaleString()}</Table.Td>
                          <Table.Td>{log.email || log.userId || "-"}</Table.Td>
                          <Table.Td>{log.action}</Table.Td>
                          <Table.Td>{log.provider || "-"}</Table.Td>
                          <Table.Td>{log.ip || "-"}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Client" : "New Client"}
        centered
        size="lg"
        classNames={{ title: "admin-modal-title" }}
      >
        <Stack gap="md">
          <TextInput
            label="Client ID"
            placeholder="chatgpt-apps"
            value={editing.clientId}
            onChange={(event) => setEditing((prev) => ({ ...prev, clientId: event.target.value }))}
            disabled={!!editingId}
          />
          <TextInput
            label="Client Secret"
            placeholder="optional"
            value={editing.clientSecret}
            onChange={(event) => setEditing((prev) => ({ ...prev, clientSecret: event.target.value }))}
          />
          <Group justify="flex-end">
            <Button
              variant="light"
              size="xs"
              onClick={() => {
                const random = globalThis.crypto?.randomUUID
                  ? globalThis.crypto.randomUUID()
                  : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
                setEditing((prev) => ({ ...prev, clientSecret: random }));
              }}
            >
              Generate Secret
            </Button>
          </Group>
          <Textarea
            label="Metadata (JSON)"
            placeholder={'{\n  "redirect_uris": ["https://..."]\n}'}
            minRows={8}
            value={editing.metadata}
            onChange={(event) => setEditing((prev) => ({ ...prev, metadata: event.target.value }))}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
