import { request } from "../../../api";
import type { EnumIndex } from "../metadata.types";

export function getEnumIndex() {
  return request<EnumIndex>("/metadata/enums");
}
