"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Group,
  LoadingOverlay,
  Menu,
  Pagination,
  SegmentedControl,
  Text
} from "@mantine/core";
import { useFilesStore, type FileStatus } from "../src/store/useFilesStore";
import { UploadModal } from "../src/components/UploadModal";
import { ApprovalStatusModal } from "../src/components/ApprovalStatusModal";
import { FileTable } from "../src/components/FileTable";
import { captureTokenFromUrl, clearAccessToken, fetchMe, redirectToSso } from "../src/lib/api";

const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Active", value: "ACTIVE" },
  { label: "Expired", value: "EXPIRED" }
];

export default function HomePage() {
  const { items, total, page, size, loading, status, fetch, upload, reapprove, remove, select, selected } =
    useFilesStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    captureTokenFromUrl();
    fetchMe()
      .then((user) => {
        setCurrentUser({ name: user?.name, email: user?.email });
        return fetch();
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, [fetch]);

  const totalPages = Math.max(1, Math.ceil(total / size));

  const handleStatusChange = (value: string) => {
    if (value === "ALL") {
      fetch(undefined, 1);
    } else {
      fetch(value as FileStatus, 1);
    }
  };

  const handleReapprove = async () => {
    if (!selected) return;
    const approverId = window.prompt("Enter approver email");
    if (!approverId) return;
    await reapprove(selected.id, [approverId]);
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm("Delete selected file?")) return;
    await remove(selected.id);
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
                    {(currentUser?.name || currentUser?.email || "U").charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ textAlign: "left" }}>
                    <Text size="sm" fw={600}>
                      {currentUser?.name || currentUser?.email || "User"}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {currentUser?.email || "SSO account"}
                    </Text>
                  </div>
                </Group>
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                color="red"
                onClick={() => {
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

      <main className="sdisk-main">
      <div className="sdisk-shell">
        <Group justify="space-between" mb="md" className="sdisk-filter-row">
          <SegmentedControl data={statusOptions} defaultValue="ALL" onChange={handleStatusChange} />
          <div className="sdisk-filter-actions">
            <div className="sdisk-actions">
              <Button onClick={() => setUploadOpen(true)} radius="md">
                Upload
              </Button>
              <Button
                variant="light"
                color="red"
                disabled={!selected}
                onClick={handleDelete}
                radius="md"
              >
                Delete
              </Button>
              <Button variant="light" disabled={!selected} onClick={handleReapprove} radius="md">
                Reapprove
              </Button>
            </div>
          </div>
        </Group>

        <div style={{ position: "relative" }}>
          <FileTable
            items={items}
            selectedId={selected?.id || null}
            onSelect={(file) => {
              select(file);
              setApprovalOpen(true);
            }}
          />
        </div>

        <Group justify="flex-end" mt="md">
          <Pagination total={totalPages} value={page} onChange={(p) => fetch(status, p)} />
        </Group>
      </div>

      <UploadModal
        opened={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={async (file, approverIds) => {
          await upload(file, approverIds);
        }}
      />
        <ApprovalStatusModal opened={approvalOpen} onClose={() => setApprovalOpen(false)} file={selected} />
      </main>
    </>
  );
}


