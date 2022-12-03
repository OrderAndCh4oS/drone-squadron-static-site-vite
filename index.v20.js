let objkts = [];

const getObjktsWithPrice = async() => {
    const result = await fetch(
        'https://api.teztok.com/v1/graphql',
        {
            method: 'POST',
            body: JSON.stringify({
                query: `query getDroneSquadronEliteObjkts {
                  tokens(
                    where: {
                            artist_address: {_eq: "tz1VgpmwW66LCbskjudK54Zp96vKn2cHjpGN"}, 
                            burned_editions: {_eq: "0"}, 
                            name: {_ilike: "Drone Squadron: Elite #%"}
                        }, 
                        limit: 1000, 
                        offset: 0,
                        order_by: {token_id: asc}
                    ) {
                    name
                    artifact_uri
                    token_id
                    lowest_price_listing
                  }
                }`,
                variables: {},
                operationName: 'getDroneSquadronEliteObjkts'
            })
        }
    );

    return await result.json();
};

async function fetchObjktsWithPrice() {
    const {errors, data} = await getObjktsWithPrice();
    if(errors) {
        console.error(errors);
        return null;
    }
    return data.tokens;
}

function addObjktToDiv(objkt) {
    const div = document.createElement('div');
    div.classList.add('box');
    div.innerHTML = makeBox(objkt);
    dronesDiv.appendChild(div);
}

(async() => {
    objkts = await fetchObjktsWithPrice();
    for(const objkt of objkts) {
        addObjktToDiv(objkt);
    }
})();

toggleSecondarySelect
    .addEventListener('change', () => {
        dronesDiv.innerHTML = '';
        if(toggleSecondarySelect.value === 'secondary') {
            for(const objkt of objkts)
                if(objkt.lowest_price_listing)
                    addObjktToDiv(objkt);
        } else {
            for(const objkt of objkts)
                addObjktToDiv(objkt);
        }
    });

const makeBox = (objkt) => `
<a href="https://objkt.com/asset/hicetnunc/${objkt.token_id}">
    <figure>
        <picture>
            <source
                srcset="https://d3bhtvw4pec0yx.cloudfront.net/fit-in/800x800/filters:format(webp)/${objkt.token_id}.png"
                type="image/webp"
            >
            <img
                loading=lazy
                src="https://d3bhtvw4pec0yx.cloudfront.net/fit-in/800x800/${objkt.token_id}.png"
                alt="Objkt ${objkt.token_id}"
                title="${objkt.title}"
            />
        </picture>
        <figcaption>${objkt.token_id}</figcaption>
    </figure>
</a>
${objkt.lowest_price_listing
    ? `<div class="price">${objkt.lowest_price_listing.price *
    0.000001}xtz</div>`
    : ''}
<div class="editions">1/1</div>
<a
    class="ipfs-link"
    href="https://nftstorage.link/ipfs/${objkt.artifact_uri.slice(7)}"
    title="View IPFS"
>
    <svg aria-hidden="true" focusable="false"
         class="icon" role="img" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 448 512" >
        <path d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zm-6 400H54a6 6 0 0 1-6-6V86a6 6 0 0 1 6-6h340a6 6 0 0 1 6 6v340a6 6 0 0 1-6 6zm-54-304l-136 .145c-6.627 0-12 5.373-12 12V167.9c0 6.722 5.522 12.133 12.243 11.998l58.001-2.141L99.515 340.485c-4.686 4.686-4.686 12.284 0 16.971l23.03 23.029c4.686 4.686 12.284 4.686 16.97 0l162.729-162.729-2.141 58.001c-.136 6.721 5.275 12.242 11.998 12.242h27.755c6.628 0 12-5.373 12-12L352 140c0-6.627-5.373-12-12-12z"></path>
    </svg>
</a>
`;

