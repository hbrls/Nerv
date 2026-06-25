import type { Vision } from "../features/vision/types";

/**
 * Vision 模拟数据。
 *
 * 手动编辑此文件即可生效，无需改动组件逻辑。
 * - `status: null` 表示不确定性占位节点（`•••`），每条轴至多一个（后端控制）。
 * - origin 节点由 VisionBuilder 自动注入，不在此声明。
 */
export const A: Vision = {
  u: [
    { id: "u1", status: "PASS" },
    { id: "u2", status: "TODO" },
    { id: "u-ellipsis", status: null },
    { id: "u5", status: "FAIL" },
    { id: "u6", status: "PASS" },
  ],
  v: [
    { id: "v1", status: "HOLD" },
    { id: "v2", status: "PASS" },
    { id: "v3", status: "TODO" },
    { id: "v-ellipsis", status: null },
    { id: "v6", status: "FAIL" },
    { id: "v-ellipsis-2", status: null },
  ],
  w: [
    { id: "w1", status: "TODO" },
    { id: "w2", status: "PASS" },
    { id: "w3", status: "FAIL" },
    { id: "w-ellipsis", status: null },
    { id: "w7", status: "HOLD" },
    { id: "w8", status: "TODO" },
    { id: "w9", status: "PASS" },
    { id: "w-ellipsis-2", status: null },
    { id: "w13", status: "HOLD" },
    { id: "w14", status: "PASS" },
    { id: "w15", status: "TODO" },
    { id: "w16", status: "FAIL" },
    { id: "w17", status: "PASS" },
  ],
};
