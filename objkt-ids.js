const getObjktIds = () =>
    fetch('https://api.teztok.com/v1/graphql', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            query: `query getDroneSquadronEliteTokens {
  tokens(
    where: {
      artist_address: {_eq: "tz1VgpmwW66LCbskjudK54Zp96vKn2cHjpGN"},
      burned_editions: {_eq: "0"},
      name: {_ilike: "Drone Squadron: Elite #%"}
    }, limit: 1000, offset: 0) {
    name
    token_id
  }
}`,
            variables: {}
        })
    });

export async function fetchObjktsIds() {
    const response = await getObjktIds();
    const data = await response.json();
    console.log(data);
    return data.data.tokens.map(o => ({
        name: o.name,
        id: o.token_id
    }));
}

export const objktIds = await fetchObjktsIds();
