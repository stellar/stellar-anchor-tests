export const SepGroupTracker: React.FC<{
  currentlyRunning: number;
  testsTotal: number;
}> = ({ currentlyRunning, testsTotal }) => {
  return (
    <>
      Running {currentlyRunning} of {testsTotal}...
    </>
  );
};
