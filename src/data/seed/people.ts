import type { DanceGroup, Member, PersonShape, VoicePart } from "../../types";
import { mulberry32, pick } from "./rng";

const FIRST_NAMES = [
  "James", "Michael", "Robert", "John", "David", "William", "Richard", "Joseph",
  "Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark",
  "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
  "George", "Timothy", "Ronald", "Edward", "Jason", "Jeffrey", "Ryan", "Jacob",
  "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott",
  "Brandon", "Benjamin", "Samuel", "Gregory", "Alexander", "Patrick", "Frank",
  "Raymond", "Jack", "Dennis", "Jerry", "Tyler", "Aaron", "Jose", "Adam",
  "Nathan", "Henry", "Douglas", "Zachary", "Peter", "Kyle", "Walter", "Ethan",
  "Jeremy", "Harold", "Keith", "Christian", "Roger", "Noah", "Gerald", "Carl",
  "Terry", "Sean", "Austin", "Arthur", "Lawrence", "Jesse", "Dylan", "Bryan",
  "Joe", "Jordan", "Billy", "Bruce", "Albert", "Willie", "Gabriel", "Logan",
  "Alan", "Juan", "Wayne", "Elijah", "Randy", "Roy", "Vincent", "Ralph",
  "Eugene", "Russell", "Bobby", "Mason", "Philip", "Louis", "Chase", "Marcus",
  "Cole", "Blake",
];

const LAST_INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const SHAPES: PersonShape[] = [
  "circle", "star", "square", "triangle", "diamond", "heart", "spade", "club",
];

const SHAPE_COLORS = [
  "#2e6f9e", "#3f8f6c", "#b06a2f", "#7a4fa3", "#c2455f", "#3a3a6e", "#3b8f9e", "#8a8536",
];

const VOICE_PARTS: VoicePart[] = ["T1", "T2", "Bar", "Bass"];
const DANCE_GROUPS: DanceGroup[] = ["Dance Line A", "Dance Line B", "Dance Line C"];

export function generatePeople(count = 106, seed = 42): Member[] {
  const rng = mulberry32(seed);
  const people: Member[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const initial = LAST_INITIALS[Math.floor(i / FIRST_NAMES.length) % LAST_INITIALS.length] ?? pick(rng, LAST_INITIALS);
    const shapeIndex = Math.floor(rng() * SHAPES.length);
    let tagShapeIndex = Math.floor(rng() * SHAPES.length);
    if (tagShapeIndex === shapeIndex) tagShapeIndex = (tagShapeIndex + 1) % SHAPES.length;
    people.push({
      id: `m-${i + 1}`,
      name: `${first} ${initial}.`,
      voicePart: VOICE_PARTS[Math.floor((i / count) * VOICE_PARTS.length) % VOICE_PARTS.length],
      danceGroup: pick(rng, DANCE_GROUPS),
      shape: SHAPES[shapeIndex],
      color: SHAPE_COLORS[shapeIndex],
      tagShape: SHAPES[tagShapeIndex],
      tagColor: SHAPE_COLORS[(shapeIndex + 3) % SHAPE_COLORS.length],
    });
  }
  return people;
}
