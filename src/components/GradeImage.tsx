import { gradeToFile } from "@/lib/utils";

interface GradeImageProps {
  grade: string;
  small?: boolean;
  style?: React.CSSProperties;
}

export default function GradeImage({ grade, small = false, style }: GradeImageProps) {
  const src = gradeToFile(grade, small);
  return (
    <img
      src={src}
      alt={grade}
      className={small ? "grade-img-small" : "grade-img-large"}
      style={style}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
