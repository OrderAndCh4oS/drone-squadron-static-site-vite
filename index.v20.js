let objkts = [];

const getObjktsWithPrice = async() => {
    const result = await fetch(
        'https://api.hicdex.com/v1/graphql',
        {
            method: 'POST',
            body: JSON.stringify({
                query: `query ObjktsWithPrice($addresses: [String!]) {
                  hic_et_nunc_token(where: {
                    creator_id: {_in: $addresses},
                    title: {_ilike: "Drone Squadron: Elite #%"},
                    token_holders: {
                        quantity: {_gt: "0"},
                        holder_id: {_neq: "tz1burnburnburnburnburnburnburjAYjjX"}, 
                    }
                  }, order_by: {title: asc}) {
                    id
                    artifact_uri
                    supply
                    swaps(where: {status: {_eq: "0"}}, order_by: {price: asc}) {
                      price
                    }
                  }
                }`,
                variables: {
                    'addresses': ['tz1VgpmwW66LCbskjudK54Zp96vKn2cHjpGN'],
                },
                operationName: 'ObjktsWithPrice',
            }),
        },
    );

    return await result.json();
};

async function fetchObjktsWithPrice() {
    const {errors, data} = await getObjktsWithPrice();
    if(errors) {
        console.error(errors);
        return null;
    }
    return data.hic_et_nunc_token;
}

function addObjktToDiv(objkt) {
    const div = document.createElement('div');
    div.classList.add('box');
    div.innerHTML = makeBox(objkt);
    dronesDiv.appendChild(div);
}

(async() => {
    objkts = await fetchObjktsWithPrice()
    console.log(objkts);
    for(const objkt of objkts) {
        addObjktToDiv(objkt);
    }
})();

toggleSecondarySelect
    .addEventListener('change', () => {
        dronesDiv.innerHTML = '';
        if(toggleSecondarySelect.value === 'secondary') {
            for(const objkt of objkts)
                if(objkt.swaps.length)
                    addObjktToDiv(objkt);
        } else {
            for(const objkt of objkts)
                addObjktToDiv(objkt);
        }
    })

const makeBox = (objkt) => `
<a href="https://www.teia.xyz/objkt/${objkt.id}">
    <figure>
        <picture>
            <source
                srcset="https://d3bhtvw4pec0yx.cloudfront.net/fit-in/800x800/filters:format(webp)/${objkt.id}.png"
                type="image/webp"
            >
            <img
                loading=lazy
                src="https://d3bhtvw4pec0yx.cloudfront.net/fit-in/800x800/${objkt.id}.png"
                alt="Objkt ${objkt.id}"
                title="${objkt.title}"
            />
        </picture>
        <figcaption>${objkt.id}</figcaption>
    </figure>
</a>
${objkt.swaps.length ? `<div class="price">${objkt.swaps[0].price * 0.000001}xtz</div>` : ''}
<div class="editions">1/1</div>
<a
    class="ipfs-link"
    href="https://cloudflare-ipfs.com/ipfs/${objkt.artifact_uri.slice(7)}"
    title="View IPFS"
>
    <svg aria-hidden="true" focusable="false"
         class="icon" role="img" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 448 512" >
        <path d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zm-6 400H54a6 6 0 0 1-6-6V86a6 6 0 0 1 6-6h340a6 6 0 0 1 6 6v340a6 6 0 0 1-6 6zm-54-304l-136 .145c-6.627 0-12 5.373-12 12V167.9c0 6.722 5.522 12.133 12.243 11.998l58.001-2.141L99.515 340.485c-4.686 4.686-4.686 12.284 0 16.971l23.03 23.029c4.686 4.686 12.284 4.686 16.97 0l162.729-162.729-2.141 58.001c-.136 6.721 5.275 12.242 11.998 12.242h27.755c6.628 0 12-5.373 12-12L352 140c0-6.627-5.373-12-12-12z"></path>
    </svg>
</a>
`

