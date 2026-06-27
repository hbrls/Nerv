import type { Vision } from "../features/vision/types";

/**
 * Vision 模拟数据。
 *
 * 手动编辑此文件即可生效，无需改动组件逻辑。
 * - `a` 标记原点 Vision 的 id，指向 v 轴数组中对应元素。
 * - v 轴存在正负轴：原点之前为负轴（正下），原点之后为正轴（正上）。
 * - u/w 轴只正轴，挂在原点上。
 * - `status: null` 表示不确定性占位节点（`•••`），每条轴至多一个（后端控制）。
 */
export const A: Vision = {
  a: "VISION-003",
  v: [
    { id: "VISION-002", name: "重启 backstage.js 项目", status: "TODO" },
    { id: "VISION-003", name: "优化 Gitlab 的读取", status: "TODO" },
    { id: "v-ellipsis", status: null },
    { id: "VISION-001", name: "重启 backstage.js 项目，优化 Gitlab 的读取", status: "TODO" },
  ],
  u: [
    { id: "u1", status: "PASS" },
    { id: "u2", status: "TODO" },
    { id: "u-ellipsis", status: null },
    { id: "u5", status: "FAIL" },
    { id: "u6", status: "PASS" },
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
