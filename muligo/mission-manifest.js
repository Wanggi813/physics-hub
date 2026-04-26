window.muligoManifest = {
  roster: [
    {
      name: "강이안",
      field: "역학",
      simuli: "뉴턴",
      missionId: "orbit-raise",
      missionTitle: "궤도 올리기",
      source: "./missions/궤도 올리기.html"
    },
    {
      name: "오해린",
      field: "파동",
      simuli: "리플",
      missionId: "lens-refraction",
      missionTitle: "렌즈의 굴절",
      source: "./missions/렌즈의 굴절.html"
    },
    {
      name: "서나윤",
      field: "전자기",
      simuli: "테슬",
      missionId: "electromagnetic-induction",
      missionTitle: "전자기유도",
      source: "./missions/전자기유도.html"
    }
  ],
  missions: [
    {
      id: "orbit-raise",
      zone: "과학실 / 역학 이상현상",
      field: "역학",
      title: "궤도 올리기",
      objective: "과학실 천장 근처에 떠오른 궤도 이상현상을 분석하고 위성의 속도를 조절해 안정 궤도에 진입하세요.",
      source: "./missions/궤도 올리기.html"
    },
    {
      id: "lens-refraction",
      zone: "도서관 / 빛의 굴절 이상현상",
      field: "파동",
      title: "렌즈의 굴절",
      objective: "도서관 책장 사이로 휘어진 빛의 경로를 관찰하고 렌즈를 조정해 광선을 목표 지점으로 보내세요.",
      source: "./missions/렌즈의 굴절.html"
    },
    {
      id: "electromagnetic-induction",
      zone: "전기실 / 전자기 이상현상",
      field: "전자기",
      title: "전자기유도",
      objective: "전기실 배전반에서 발생한 이상 전류를 관찰하고 유도 전류의 방향을 안정화하세요.",
      source: "./missions/전자기유도.html"
    }
  ]
};
