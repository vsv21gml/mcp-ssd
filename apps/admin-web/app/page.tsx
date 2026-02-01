"use client";

import { useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  LoadingOverlay,
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
import { captureTokenFromUrl, clearAccessToken, fetchMe, redirectToSso } from "../src/lib/api";

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

type Section = "clients" | "users";

export default function AdminPage() {
  const { items, users, loading, fetchAll, create, update, remove, updateRole } = useClientsStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditorState>(emptyEditor);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [me, setMe] = useState<{ name?: string | null; email?: string | null; role?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [section, setSection] = useState<Section>("clients");

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

  if (authLoading) {
    return (
      <main className="admin-main">
        <div className="admin-shell" style={{ display: "grid", placeItems: "center" }}>
          <Text size="sm" c="dimmed">
            Authenticating...
          </Text>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="admin-header">
        <div className="admin-header-inner">
          <div>
            <div className="admin-title">Admin Console</div>
            <div className="admin-subtitle">OAuth client registry & user roles</div>
          </div>
          <Group>
            <Group gap="sm">
              <Avatar radius="xl" size="sm" color="samsung">
                {(me?.name || me?.email || "A").charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ textAlign: "left" }}>
                <Text size="sm" fw={600}>
                  {me?.name || me?.email || "Admin"}
                </Text>
                <Text size="xs" c="dimmed">
                  {me?.role || "MEMBER"}
                </Text>
              </div>
            </Group>
            <Button
              variant="light"
              color="red"
              onClick={() => {
                clearAccessToken();
                redirectToSso();
              }}
            >
              Logout
            </Button>
          </Group>
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
        </aside>

        <div className="admin-shell">
          <section className="admin-content">
            {section === "clients" && (
              <>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Registered Clients</Text>
                  <Button onClick={handleCreate}>New Client</Button>
                </Group>

                <div style={{ position: "relative" }}>
                  <LoadingOverlay visible={loading} />
                  <Table withRowBorders highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
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
                          <Table.Td colSpan={5}>
                            <Text size="sm" c="dimmed">
                              No clients
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                      {items.map((client) => (
                        <Table.Tr key={client.clientId}>
                          <Table.Td>{client.clientId}</Table.Td>
                          <Table.Td>
                            {client.clientSecret ? <Badge color="samsung">Stored</Badge> : "-"}
                          </Table.Td>
                          <Table.Td style={{ maxWidth: 260 }}>
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {(client.metadata?.redirect_uris || []).join(", ") || "-"}
                            </Text>
                          </Table.Td>
                          <Table.Td>{new Date(client.updatedAt).toLocaleString()}</Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon variant="light" onClick={() => handleEdit(client)} aria-label="Edit">
                                Edit
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={async () => {
                                  await remove(client.clientId);
                                }}
                                aria-label="Delete"
                              >
                                Del
                              </ActionIcon>
                            </Group>
                          </Table.Td>
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
                  <LoadingOverlay visible={loading} />
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
