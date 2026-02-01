import { Badge, Group, Modal, Stack, Text, Table, Divider } from "@mantine/core";
import type { FileRecord } from "../store/useFilesStore";

const statusColor: Record<string, string> = {
  PENDING: "yellow",
  REJECTED: "red",
  ACTIVE: "green",
  EXPIRED: "gray"
};

interface ApproverRow {
  name: string;
  email: string;
  role: "APPROVAL" | "AGREEMENT" | "NOTICE";
  status?: string;
}

interface ApprovalStatusModalProps {
  opened: boolean;
  onClose: () => void;
  file?: (FileRecord & { approvers?: ApproverRow[] }) | null;
}

export function ApprovalStatusModal({ opened, onClose, file }: ApprovalStatusModalProps) {
  const approvers = file?.approvers || [];
  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
      .format(date)
      .replace(/\s+/g, " ");
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Approval status"
      centered
      size="lg"
      classNames={{ title: "sdisk-modal-title" }}
    >
      {file ? (
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>{file.originalName}</Text>
            <Badge color={statusColor[file.status]}>{file.status}</Badge>
          </Group>

          <Group gap="xl">
            <Text size="sm" c="dimmed">
              Uploaded
            </Text>
            <Text size="sm" fw={600}>
              {formatDate(file.createdAt)}
            </Text>
            <Text size="sm" c="dimmed">
              Expires
            </Text>
            <Text size="sm" fw={600}>
              {formatDate(file.expiresAt)}
            </Text>
          </Group>

          {file.rejectionReason && (
            <Text size="sm" c="red">
              Rejection: {file.rejectionReason}
            </Text>
          )}

          <Divider />

          <Text size="sm" fw={600}>
            Approvers
          </Text>
          <Table withRowBorders highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {approvers.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text size="sm" c="dimmed">
                      No approver data yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {approvers.map((row, index) => (
                <Table.Tr key={`${row.email}-${index}`}>
                  <Table.Td>{row.name}</Table.Td>
                  <Table.Td>{row.email}</Table.Td>
                  <Table.Td>{row.role}</Table.Td>
                  <Table.Td>{row.status || "-"}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          No file selected.
        </Text>
      )}
    </Modal>
  );
}

