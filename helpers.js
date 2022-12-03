export const shortenWalletAddress = creator => {
    return creator.slice(0, 5) + '...' + creator.slice(-5);
};

export const makeLink = (link, text) => {
    const a = document.createElement('a');
    a.innerText = text;
    a.href = link;
    return a;
};

export function makeObjktLink(objktId) {
    return makeLink(`https://teia.xyz/objkt/${objktId}/`, objktId);
}

export function makeWalletLink(walletAddress) {
    return makeLink(
        `https://teia.xyz/tz/${walletAddress}/`,
        shortenWalletAddress(walletAddress),
    );
}

export const makeTdText = (text) => {
    const td = document.createElement('td');
    td.innerText = text;
    return td;
};

export const makeTdContent = (content) => {
    const td = document.createElement('td');
    td.appendChild(content);
    return td;
};

export const makeRows = (data, table) => {
    for(let i = 0; i < data.length; i++) {
        const highScore = data[i];
        const row = document.createElement('tr');
        row.appendChild(owner);
        table.appendChild(row);
    }
};

const getObjktData = () =>
    fetch('https://api.hicdex.com/v1/graphql', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            query: `query ObjktData($addresses: [String!]) {
                hic_et_nunc_token(where: {
                    creator_id: {_in: $addresses},
                    title: {_ilike: "Drone Squadron: Elite #%"},
                    token_holders: {
                        quantity: {_gt: "0"},
                        holder_id: {_neq: "tz1burnburnburnburnburnburnburjAYjjX"},
                    }}, order_by: {title: asc}) {
                    id
                    title
                    token_holders(where: {_not: {holder_id: {_eq: "tz1VgpmwW66LCbskjudK54Zp96vKn2cHjpGN"}}}) {
                        holder_id
                        quantity
                    }
                }
            }`,
            variables: {
                'addresses': ['tz1VgpmwW66LCbskjudK54Zp96vKn2cHjpGN'],
            },
        }),
    });

export async function fetchObjkts() {
    const response = await getObjktData();
    const data = await response.json();
    return data.data.hic_et_nunc_token;
}

export const getObjktAndTokenHolder = (objkts, squadronNumber) => {
    const objkt = objkts.find(o => o.title.includes(squadronNumber));
    const tokenHolder = objkt?.token_holders?.[0]?.holder_id || 'n/a';
    return {objkt, tokenHolder};
};

const getUserMetadataByWalletId = (walletId) => fetch(
    `https://api.tzkt.io/v1/accounts/${walletId}/metadata`,
    {method: 'GET'},
);

export const getProfiles = async(uniqueCreatorWalletIds) => {
    const uniqueWalletIds = [...(new Set(uniqueCreatorWalletIds))];
    const responses = [...(await Promise.allSettled(uniqueWalletIds.map(id => getUserMetadataByWalletId(id))))]
    const data = [];
    for(let i = 0; i < responses.length; i++) {
        const response = responses[i];
        try {
            const json = await response.value.json();
            data.push({...json, wallet: uniqueWalletIds[i]});
        } catch(e) {
            console.warn('Missing JSON for ' + uniqueWalletIds[i])
        }
    }
    return data.reduce((obj, profile) => {
        try {
            obj[profile.wallet] = profile;
        } catch(e) {
            console.warn('Error fetching metadata:', e);
        }
        return obj;
    }, {});
};

export const mapSquadsToObjktDataAndProfiles = (objkts, profiles) => d => {
    const {objkt, tokenHolder} = getObjktAndTokenHolder(objkts, d.number);
    const profile = profiles?.[tokenHolder];
    return {
        ...d,
        objktId: objkt?.id || 'n/a',
        owner: tokenHolder || 'n/a',
        alias: profile?.alias || profile?.twitter || profile?.instagram || '-'
    };
};
