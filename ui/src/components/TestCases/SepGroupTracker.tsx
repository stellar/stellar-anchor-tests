export const SepGroupTracker: React.FC<{
  testsCompleted: number;
  testsTotal: number;
}> = ({ testsCompleted, testsTotal }) => {
  return (
    <>
      Running {testsCompleted} of {testsTotal}...
    </>
  );
};
