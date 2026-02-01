import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Stack,
  Stepper,
  Table,
  Text,
  Textarea,
  Autocomplete,
  Select,
  Box
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";

interface ApproverRow {
  id: string;
  name: string;
  email: string;
  role: "APPROVAL" | "AGREEMENT" | "NOTICE";
}

interface UploadModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (file: File, approverIds: string[]) => Promise<void>;
}

const roleOptions = [
  { value: "APPROVAL", label: "Approval" },
  { value: "AGREEMENT", label: "Agreement" },
  { value: "NOTICE", label: "Notice" }
];

export function UploadModal({ opened, onClose, onSubmit }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [searchEmail, setSearchEmail] = useState("");
  const [comment, setComment] = useState("");
  const [approvers, setApprovers] = useState<ApproverRow[]>([]);

  const fileLabel = useMemo(() => (file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : ""), [file]);

  const approvalApprovers = approvers.filter((row) => row.role === "APPROVAL");
  const approverIds = approvalApprovers.map((row) => row.email || row.id);

  const handleAddApprover = () => {
    if (!searchEmail) return;
    const id = searchEmail.split("@")[0] || searchEmail;
    setApprovers((prev) => [
      ...prev,
      {
        id: `${id}-${prev.length + 1}`,
        name: id,
        email: searchEmail,
        role: "APPROVAL"
      }
    ]);
    setSearchEmail("");
  };

  const updateRole = (index: number, role: ApproverRow["role"]) => {
    setApprovers((prev) => prev.map((row, idx) => (idx === index ? { ...row, role } : row)));
  };

  const handleSubmit = async () => {
    if (!file || approverIds.length === 0) return;
    setSubmitting(true);
    await onSubmit(file, approverIds);
    setSubmitting(false);
    setFile(null);
    setApprovers([]);
    setComment("");
    setActiveStep(0);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Upload & Approval"
      centered
      size="xl"
      classNames={{ title: "sdisk-modal-title" }}
    >
      <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false} mb="lg">
        <Stepper.Step label="Upload" description="Select file" />
        <Stepper.Step label="Approver" description="Set approvers" />
      </Stepper>

      {activeStep === 0 && (
        <Stack gap="md">
          <Dropzone
            onDrop={(files) => setFile(files[0] || null)}
            multiple={false}
            maxSize={1024 * 1024 * 200}
          >
            <Group justify="center" gap="xs" style={{ minHeight: 160, pointerEvents: "none" }}>
              <Stack align="center" gap={6}>
                <Badge color="samsung" variant="light" size="lg">
                  Drop file here
                </Badge>
                <Text size="sm" c="dimmed">
                  Click to browse or drag & drop (max 200MB)
                </Text>
              </Stack>
            </Group>
          </Dropzone>

          {file && (
            <Box
              style={{
                borderRadius: 12,
                border: "1px solid rgba(20, 40, 160, 0.15)",
                padding: "12px 14px",
                background: "rgba(255, 255, 255, 0.7)"
              }}
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text size="sm" fw={600}>
                    {file.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {Math.round(file.size / 1024)} KB
                  </Text>
                </div>
                <Button variant="light" size="xs" onClick={() => setFile(null)}>
                  Remove
                </Button>
              </Group>
            </Box>
          )}

          {!file && fileLabel && (
            <Text size="sm" c="dimmed">
              Selected: {fileLabel}
            </Text>
          )}
          <Group justify="space-between">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setActiveStep(1)} disabled={!file}>
              Next
            </Button>
          </Group>
        </Stack>
      )}

      {activeStep === 1 && (
        <Stack gap="md">
          <Group align="flex-end" justify="space-between" wrap="nowrap">
            <Autocomplete
              label="Approver search"
              placeholder="Search by email"
              value={searchEmail}
              onChange={setSearchEmail}
              data={[]}
              style={{ flex: 1 }}
            />
            <Button onClick={handleAddApprover} disabled={!searchEmail}>
              Add
            </Button>
          </Group>

          <Divider />

          <Table withRowBorders highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {approvers.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text size="sm" c="dimmed">
                      No approvers added.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {approvers.map((row, index) => (
                <Table.Tr key={`${row.id}-${index}`}>
                  <Table.Td>{row.name}</Table.Td>
                  <Table.Td>{row.email}</Table.Td>
                  <Table.Td>
                    <Select
                      value={row.role}
                      onChange={(value) => updateRole(index, (value as ApproverRow["role"]) || "APPROVAL")}
                      data={roleOptions}
                      allowDeselect={false}
                      size="xs"
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {approverIds.length === 0 && (
            <Text size="sm" c="red">
              Please add at least one approver with role "Approval".
            </Text>
          )}

          <Textarea
            label="Submission comment"
            placeholder="Write your comment"
            minRows={3}
            value={comment}
            onChange={(event) => setComment(event.currentTarget.value)}
          />

          <Group justify="space-between">
            <Button variant="light" onClick={() => setActiveStep(0)}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={!file || approverIds.length === 0} loading={submitting}>
              Submit
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
