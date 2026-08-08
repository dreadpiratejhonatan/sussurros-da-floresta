const KEY = "sdf-save-v1";

const defaultData = () => ({
  skinId: "albert",
  difficulty: "normal",
  solved: {},
  lore: {},
  animals: {},
  bestTimeSec: null,
  runs: 0,
});

export class Save {
  constructor() {
    this.data = defaultData();
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      this.data = {
        ...defaultData(),
        ...parsed,
        solved: { ...parsed.solved },
        lore: { ...parsed.lore },
        animals: { ...parsed.animals },
      };
    } catch {
      this.data = defaultData();
    }
  }

  persist() {
    localStorage.setItem(KEY, JSON.stringify(this.data));
  }

  isSolved(saveId) {
    return !!this.data.solved[saveId];
  }

  markSolved(saveId) {
    this.data.solved[saveId] = true;
    this.persist();
  }

  isLore(saveId) {
    return !!this.data.lore[saveId];
  }

  markLore(saveId) {
    this.data.lore[saveId] = true;
    this.persist();
  }

  sawAnimal(id) {
    return !!this.data.animals[id];
  }

  markAnimal(id) {
    this.data.animals[id] = true;
    this.persist();
  }

  solvedCount(puzzleIds) {
    return puzzleIds.filter((id) => this.data.solved[id]).length;
  }

  loreCount(ids) {
    return ids.filter((id) => this.data.lore[id]).length;
  }

  animalCount(ids) {
    return ids.filter((id) => this.data.animals[id]).length;
  }

  resetRunProgress() {
    this.data.solved = {};
    this.data.lore = {};
    this.data.animals = {};
    this.persist();
  }
}
