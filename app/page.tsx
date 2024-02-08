import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  getPreviousFrame,
  useFramesReducer,
  validateActionSignature,
} from "frames.js/next/server";
import Link from "next/link";

type State = {
  page: number;
};

const initialState = { page: 1 };

const reducer: FrameReducer<State> = (state, action) => {
  const buttonIndex = action.postBody?.untrustedData.buttonIndex;
  return {
    page:
      state.page === 1 && buttonIndex === 1
        ? 2
        : buttonIndex === 1
        ? state.page - 1
        : buttonIndex === 2
        ? state.page + 1
        : 1,
  };
};

const lastPage = 6;

// This is a react server component only
export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const previousFrame = getPreviousFrame<State>(searchParams);

  const validMessage = await validateActionSignature(previousFrame.postBody);
  let username = '';
  let profilePicUrl = '';

  if (validMessage?.data.fid) {
    const response = await fetch(`https://searchcaster.xyz/api/profiles?fid=${validMessage.data.fid}`);
    if (response.ok) {
      const data = await response.json();
      // Assuming the API response structure, adjust accordingly
      username = data[0].body.username;
      profilePicUrl = data[0].body.avatarUrl;
      console.log("username", username,profilePicUrl);
    }
  }
  //console.log("validMessage", validMessage?.data.fid,username,profilePicUrl);

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  // then, when done, return next frame
  return (
    <div>
      <a href="https://tophattalks.vercel.app/?room=chat1">TopHatTalks</a> homeframe{" "}
      {process.env.NODE_ENV === "development" ? (
        <Link href="/debug">Debug</Link>
      ) : null}
      <FrameContainer
        postUrl="/frames"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage
          src={
            state.page === 1
            ? `${process.env.NEXT_PUBLIC_HOST}/welcome.png`
            : `${process.env.NEXT_PUBLIC_HOST}/welcome2.png`
          }
        />
        {state.page !== 1 ? (
          <FrameButton onClick={dispatch}>←</FrameButton>
        ) : null}
        {state.page < 2 ? (
          <FrameButton onClick={dispatch}>→</FrameButton>
        ) : (
          <FrameButton href={`https://tophattalks.vercel.app/?room=chat1&video=true&audio=true&username=${username}`}>Open TopHat Talks</FrameButton>
        )}
      </FrameContainer>
    </div>
  );
}
