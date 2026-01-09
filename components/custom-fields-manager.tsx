"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, X } from "lucide-react";

export type CustomFieldType =
  | "text"
  | "textarea"
  | "date"
  | "datetime"
  | "dropdown"
  | "radio"
  | "checkbox";

export interface CustomFieldOption {
  id?: number;
  option_value: string;
  option_label: string;
  sort_order: number;
}

export interface CustomField {
  id?: number;
  field_name: string;
  field_label: string;
  field_type: CustomFieldType;
  is_required: boolean;
  sort_order: number;
  options?: CustomFieldOption[];
}

interface CustomFieldsManagerProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Teks Singkat" },
  { value: "textarea", label: "Teks Panjang" },
  { value: "date", label: "Tanggal" },
  { value: "datetime", label: "Tanggal & Waktu" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Radio Button" },
  { value: "checkbox", label: "Checkbox" },
];

export function CustomFieldsManager({
  fields,
  onChange,
  onValidationChange,
}: CustomFieldsManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const generateFieldName = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .trim();
  };

  const handleFieldNameChange = (fieldIndex: number, value: string) => {
    const formattedValue = value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    updateField(fieldIndex, { field_name: formattedValue });
  };

  const addField = () => {
    const newField: CustomField = {
      field_name: "",
      field_label: "",
      field_type: "text",
      is_required: false,
      sort_order: fields.length,
      options: [],
    };
    onChange([...fields, newField]);
  };

  const validateFields = (): string[] => {
    const errors: string[] = [];

    fields.forEach((field, index) => {
      if (!field.field_label.trim()) {
        errors.push(`Field ${index + 1}: Label pertanyaan harus diisi`);
      }

      if (!field.field_name.trim()) {
        errors.push(`Field ${index + 1}: Field name harus diisi`);
      }

      if (field.field_name && !/^[a-z][a-z0-9_]*$/.test(field.field_name)) {
        errors.push(
          `Field ${index + 1}: Field name harus lowercase, dimulai dengan huruf, dan hanya boleh mengandung huruf, angka, dan underscore`,
        );
      }

      if (["dropdown", "radio", "checkbox"].includes(field.field_type)) {
        if (!field.options || field.options.length === 0) {
          errors.push(
            `Field ${index + 1}: Opsi harus diisi untuk tipe ${field.field_type}`,
          );
        } else {
          field.options.forEach((option, optionIndex) => {
            if (!option.option_label.trim()) {
              errors.push(
                `Field ${index + 1}, Opsi ${optionIndex + 1}: Label opsi harus diisi`,
              );
            }
            if (!option.option_value.trim()) {
              errors.push(
                `Field ${index + 1}, Opsi ${optionIndex + 1}: Value opsi harus diisi`,
              );
            }
          });
        }
      }
    });

    return errors;
  };

  const updateField = (index: number, updates: Partial<CustomField>) => {
    const updatedFields = [...fields];
    const field = updatedFields[index];

    if (
      updates.field_type &&
      !["dropdown", "radio", "checkbox"].includes(updates.field_type)
    ) {
      updates.options = [];
    }

    if (
      updates.field_type &&
      ["dropdown", "radio", "checkbox"].includes(updates.field_type) &&
      !field.options?.length
    ) {
      updates.options = [
        { option_value: "option1", option_label: "Opsi 1", sort_order: 0 },
        { option_value: "option2", option_label: "Opsi 2", sort_order: 1 },
      ];
    }

    updatedFields[index] = { ...field, ...updates };
    onChange(updatedFields);
  };

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    updatedFields.forEach((field, i) => {
      field.sort_order = i;
    });
    onChange(updatedFields);
  };

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    if (!field.options) return;

    const newOption: CustomFieldOption = {
      option_value: `option${field.options.length + 1}`,
      option_label: `Opsi ${field.options.length + 1}`,
      sort_order: field.options.length,
    };

    const updatedOptions = [...field.options, newOption];
    updateField(fieldIndex, { options: updatedOptions });
  };

  const updateOption = (
    fieldIndex: number,
    optionIndex: number,
    updates: Partial<CustomFieldOption>,
  ) => {
    const field = fields[fieldIndex];
    if (!field.options) return;

    const updatedOptions = [...field.options];
    updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], ...updates };
    updateField(fieldIndex, { options: updatedOptions });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    if (!field.options) return;

    const updatedOptions = field.options.filter((_, i) => i !== optionIndex);
    updatedOptions.forEach((option, i) => {
      option.sort_order = i;
    });
    updateField(fieldIndex, { options: updatedOptions });
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const updatedFields = [...fields];
    const [movedField] = updatedFields.splice(fromIndex, 1);
    updatedFields.splice(toIndex, 0, movedField);

    updatedFields.forEach((field, index) => {
      field.sort_order = index;
    });

    onChange(updatedFields);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveField(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  React.useEffect(() => {
    if (onValidationChange) {
      const errors = validateFields();
      onValidationChange(errors.length === 0, errors);
    }
  }, [fields]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Manajemen Field Pendaftaran Kustom
        </h3>
        <Button
          onClick={addField}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Field Baru
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Belum ada custom field. Klik "Tambah Field Baru" untuk menambahkan
            field kustom.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fields.map((field, fieldIndex) => (
            <Card key={fieldIndex} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GripVertical
                      className="h-4 w-4 text-gray-400 cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, fieldIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, fieldIndex)}
                    />
                    <CardTitle className="text-base">
                      Field {fieldIndex + 1}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(fieldIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`field_label_${fieldIndex}`}>
                      Label Pertanyaan *
                    </Label>
                    <Input
                      id={`field_label_${fieldIndex}`}
                      value={field.field_label}
                      onChange={(e) =>
                        updateField(fieldIndex, {
                          field_label: e.target.value,
                        })
                      }
                      placeholder="Contoh: Pilih Ukuran Jersey"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`field_name_${fieldIndex}`}>
                      Field Name *
                    </Label>
                    <Input
                      id={`field_name_${fieldIndex}`}
                      value={field.field_name}
                      onChange={(e) =>
                        handleFieldNameChange(fieldIndex, e.target.value)
                      }
                      placeholder="Contoh: jersey_size"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`field_type_${fieldIndex}`}>
                      Tipe Field *
                    </Label>
                    <Select
                      value={field.field_type}
                      onValueChange={(value: CustomFieldType) =>
                        updateField(fieldIndex, { field_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`is_required_${fieldIndex}`}
                    checked={field.is_required}
                    onCheckedChange={(checked) =>
                      updateField(fieldIndex, { is_required: checked })
                    }
                  />
                  <Label htmlFor={`is_required_${fieldIndex}`}>
                    Wajib Diisi
                  </Label>
                </div>

                {["dropdown", "radio", "checkbox"].includes(field.field_type) &&
                  field.options && (
                    <div className="space-y-3">
                      <Label>
                        Opsi untuk{" "}
                        {
                          FIELD_TYPES.find((t) => t.value === field.field_type)
                            ?.label
                        }
                      </Label>
                      <div className="space-y-2">
                        {field.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center space-x-2"
                          >
                            <Input
                              value={option.option_label}
                              onChange={(e) =>
                                updateOption(fieldIndex, optionIndex, {
                                  option_label: e.target.value,
                                  option_value: generateFieldName(
                                    e.target.value,
                                  ),
                                })
                              }
                              placeholder="Label opsi"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeOption(fieldIndex, optionIndex)
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(fieldIndex)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Opsi
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button
          onClick={addField}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Field Baru
        </Button>
      </div>
    </div>
  );
}
