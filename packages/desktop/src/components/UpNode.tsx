import { ContentNode } from "./ContentNode";
import type { ContentNodeProps } from "./ContentNode";

export type UpNodeProps = Omit<ContentNodeProps, "axis">;

/** u 轴业务节点的轴向策略。 */
export function UpNode(props: UpNodeProps) {
  return <ContentNode {...props} axis="u" />;
}
