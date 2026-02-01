import { Badge, Checkbox, Group, Table, Text } from "@mantine/core";
import type { FileRecord } from "../store/useFilesStore";

const statusColor: Record<string, string> = {
  PENDING: "yellow",
  REJECTED: "red",
  ACTIVE: "green",
  EXPIRED: "gray"
};

interface FileTableProps {
  items: FileRecord[];
  onSelect: (file: FileRecord) => void;
  selectedId?: string | null;
}

export function FileTable({ items, onSelect, selectedId }: FileTableProps) {
  return (
    <Table withRowBorders={false} highlightOnHover className="sdisk-table">
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: 40 }}></Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Uploaded</Table.Th>
          <Table.Th>Expires</Table.Th>
          <Table.Th>Size</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((file) => (
          <Table.Tr
            key={file.id}
            onClick={() => onSelect(file)}
            style={{ cursor: "pointer", background: file.id === selectedId ? "rgba(20, 40, 160, 0.06)" : undefined }}
          >
            <Table.Td>
              <Checkbox checked={file.id === selectedId} readOnly />
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <Text fw={600}>{file.originalName}</Text>
              </Group>
            </Table.Td>
            <Table.Td>
              <Badge color={statusColor[file.status]}>{file.status}</Badge>
            </Table.Td>
            <Table.Td>{new Date(file.createdAt).toLocaleString()}</Table.Td>
            <Table.Td>{file.expiresAt ? new Date(file.expiresAt).toLocaleString() : "-"}</Table.Td>
            <Table.Td>{Math.round(file.size / 1024)} KB</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}


