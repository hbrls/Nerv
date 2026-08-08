import { ContentNode } from "./ContentNode";
import type { ContentNodeProps } from "./ContentNode";

export type WorkNodeProps = Omit<ContentNodeProps, "axis">;

/** w 轴业务节点的轴向策略。 */
export function WorkNode(props: WorkNodeProps) {
  return <ContentNode {...props} axis="w" />;
}
