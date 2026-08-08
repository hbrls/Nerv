import { ContentNode } from "./ContentNode";
import type { ContentNodeProps } from "./ContentNode";

export type VisionNodeProps = Omit<ContentNodeProps, "axis">;

/** v 轴业务节点的轴向与 origin 策略。 */
export function VisionNode(props: VisionNodeProps) {
  return <ContentNode {...props} axis="v" />;
}
