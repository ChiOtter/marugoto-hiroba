import type { UserProfile } from "../users";
import DateBadge from "./DateBadge";
import UserBubble from "./UserBubble";
import { toUserBubbleData } from "./userBubbleData";
import "./HomeCanvas.css";

type HomeCanvasProps = {
  currentUser: UserProfile | null;
  onlineUsers: UserProfile[];
  onlineTimeLabels: Record<string, string>;
  onClickDate: () => void;
  onClickSelf: (uid: string) => void;
  onClickUser: (uid: string) => void;
};

type BubblePosition = {
  left: string;
  top: string;
};

function HomeCanvas({
  currentUser,
  onlineUsers,
  onlineTimeLabels,
  onClickDate,
  onClickSelf,
  onClickUser,
}: HomeCanvasProps) {
  const positions = createBubblePositions(onlineUsers.map((user) => user.uid));

  return (
    <section className="home-canvas">
      <div className="home-canvas__background home-canvas__background--one" />
      <div className="home-canvas__background home-canvas__background--two" />

      <header className="home-canvas__header">
        <div>
          <p className="home-canvas__eyebrow">Marugoto Hiroba</p>
          <h1 className="home-canvas__title">いま同じ時間を過ごしている人たち</h1>
        </div>
        <div className="home-canvas__status">
          オンライン中の他ユーザー: {onlineUsers.length}人
        </div>
      </header>

      <div className="home-canvas__stage">
        {onlineUsers.map((user, index) => (
          <UserBubble
            key={user.uid}
            data={toUserBubbleData(user, onlineTimeLabels[user.uid] ?? "0分")}
            onClick={onClickUser}
            style={positions[index]}
          />
        ))}
      </div>

      {currentUser && (
        <aside className="home-canvas__self">
          <p className="home-canvas__self-label">You</p>
          <UserBubble
            className="user-bubble--self"
            data={toUserBubbleData(
              currentUser,
              onlineTimeLabels[currentUser.uid] ?? "0分",
            )}
            onClick={onClickSelf}
          />
        </aside>
      )}

      <DateBadge onClick={onClickDate} />
    </section>
  );
}

const createBubblePositions = (uids: string[]): BubblePosition[] => {
  const placed: Array<{ x: number; y: number }> = [];

  return uids.map((uid, index) => {
    const seed = hashUid(uid);
    let x = 18 + (seed % 64);
    let y = 16 + (Math.floor(seed / 64) % 58);
    let retries = 0;

    while (isTooClose(x, y, placed) && retries < 24) {
      x = 18 + ((x + 11 + index * 3) % 64);
      y = 16 + ((y + 9 + index * 5) % 58);
      retries += 1;
    }

    placed.push({ x, y });

    return {
      left: `${x}%`,
      top: `${y}%`,
    };
  });
};

const isTooClose = (
  x: number,
  y: number,
  placed: Array<{ x: number; y: number }>,
): boolean => {
  return placed.some((point) => {
    const dx = point.x - x;
    const dy = point.y - y;
    return Math.sqrt(dx * dx + dy * dy) < 14;
  });
};

const hashUid = (uid: string): number => {
  let hash = 0;

  for (let index = 0; index < uid.length; index += 1) {
    hash = (hash * 31 + uid.charCodeAt(index)) >>> 0;
  }

  return hash;
};

export default HomeCanvas;
