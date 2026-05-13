"use client";

const LETTER_TO_HEX: Record<string, string> = {
  A: "e6", B: "e7", C: "e8", D: "e9", E: "ea", F: "eb", G: "ec", H: "ed",
  I: "ee", J: "ef", K: "f0", L: "f1", M: "f2", N: "f3", O: "f4", P: "f5",
  Q: "f6", R: "f7", S: "f8", T: "f9", U: "fa", V: "fb", W: "fc", X: "fd",
  Y: "fe", Z: "ff",
};

function countryToEmojiSequence(code: string): string {
  const upper = code.toUpperCase();
  return `1f1${LETTER_TO_HEX[upper[0]]}-1f1${LETTER_TO_HEX[upper[1]]}`;
}

export default function Flag({
  country,
  title,
}: {
  country: string;
  title?: string;
}) {
  const seq = countryToEmojiSequence(country);
  const url = `https://osu.ppy.sh/assets/images/flags/${seq}.svg`;
  return (
    <span
      className="flag-img"
      title={title ?? country.toUpperCase()}
      style={{ backgroundImage: `url('${url}')` }}
    />
  );
}
