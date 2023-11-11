const express = require('express');
const flash = require('connect-flash');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
const app = express();

const dotenv = require('dotenv');
dotenv.config();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); // To parse the incoming requests with JSON payloads
app.use(express.static('public')); // To serve static files
app.use(session({
    secret: 'secret', // Change the secret to a real secret key in your production app
    resave: false,
    saveUninitialized: false
}));
app.use(flash());


const url = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

async function connect() {
    await client.connect();
    console.log("Connected to MongoDB");
}

connect();
const collection = client.db("palastine").collection("products");

app.get('/', async (req, res) => {
    const products = await collection.find({ status: { $ne: 'pending' }, }).toArray();
    res.render('index', { products: products, success_msg: req.flash('success_msg') });
});
app.get('/product/:id', async (req, res) => {
    console.log(req.params.id);
    const id = new ObjectId(req.params.id); // Convert to ObjectId
    const product = await collection.findOne({ _id: id });
    console.log(product);
    res.render('product-details', { product: product });
    // res.json(product);
}); 

app.get('/search', async (req, res) => {
    const searchQuery = req.query.query; // Get the search query from the URL

    // Perform a search in your MongoDB collection
    // Adjust the fields to search as per your requirements
    const searchResults = await collection.find({
        status: { $ne: 'pending' },
        $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { productName: { $regex: searchQuery, $options: 'i' } },
            { productDescription: { $regex: searchQuery, $options: 'i' } }
        ]
    }).toArray();

    // Render a page with the search results or the same index page with new data
    res.render('index', { products: searchResults, success_msg: req.flash('success_msg')});
});

app.post('/add-product', async (req, res) => {
    const { name, productDescription, categories, proofLink, explanationText, alternatives } = req.body;
    console.log(req.body);

    // Validate required fields
    if (!name || !productDescription || !categories || !proofLink) {
        // Handle the error, e.g., send a response or render a page with an error message
        return res.status(400).send('Required fields are missing');
    }

    const newProduct = {
        name,
        productDescription,
        categories: categories.split(',').map(cat => cat.trim()), // Split categories into an array
        proofLink,
        explanationText: explanationText || null,
        alternatives: alternatives || null,
        status: 'pending'
    };
    console.log(newProduct);

    await collection.insertOne(newProduct);
    req.flash('success_msg', 'Product added successfully and is under review.');
    res.redirect('/'); // Redirect to the home page after adding
});


async function addData(prop) {
    const collection = client.db("palastine").collection("products");
    try {
        const result = await collection.insertMany(prop);
        console.log({ message: "Products saved successfully", result: result });
    } catch (error) {
        console.log({ message: "Error saving products", error: error });
    }
};



const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});




// addData([
//     {
//       "logo": "https://assets.turbologo.com/blog/en/2020/02/19084627/7up-cover.jpg",
//       "name": "7up",
//       "whyLink": "https://boycott.thewitness.news/target/7up",
//       "productName": "7up",
//       "productDescription": "7up",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
//     },
//     {
//       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/acqua-panna-logo-round.png",
//       "name": "Acqua Panna",
//       "whyLink": "https://boycott.thewitness.news/target/acquapanna",
//       "productName": "Acqua Panna",
//       "productDescription": "Acqua Panna",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
//     },
//     {
//       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/asset-library/publishingimages/brands/chocolate-confectionery/aero-logo-round.png",
//       "name": "Aero",
//       "whyLink": "https://boycott.thewitness.news/target/aero",
//       "productName": "Aero",
//       "productDescription": "Aero",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
//     },
//     {
//       "logo": "https://brandlogos.net/wp-content/uploads/2022/05/aesop-logo_brandlogos.net_pedrx.png",
//       "name": "Aesop",
//       "whyLink": "https://boycott.thewitness.news/target/aesop",
//       "productName": "Aesop",
//       "productDescription": "Aesop",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
//     },
//     {
//       "logo": "https://www.bookingholdings.com/wp-content/uploads/2019/10/bkng_brands-fullyopen-agoda-1.svg",
//       "name": "Agoda",
//       "whyLink": "https://boycott.thewitness.news/target/agoda",
//       "productName": "Agoda",
//       "productDescription": "Agoda",
//       "categories": [
//         "TECHNOLOGY",
//         "TRAVEL"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.aljazeera.com/news/2022/10/5/is-booking-com-reversal-palestine-corporate-hypocrisy"
//     },
//     {
//       "logo": "https://www.luxurylabcosmetics.it/wp-content/uploads/2019/06/logos-HP_ahava.jpg",
//       "name": "Ahava",
//       "whyLink": "https://boycott.thewitness.news/target/ahava",
//       "productName": "Ahava",
//       "productDescription": "Ahava",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://electronicintifada.net/content/boycott-ahava-dead-sea-products-makes-impact/8563"
//     },
//     {
//       "logo": "https://s.yimg.com/uu/api/res/1.2/Bz8iDlw16Zf6PVc.y33xdg--~B/aD0zOTA7dz02MTA7YXBwaWQ9eXRhY2h5b24-/http://globalfinance.zenfs.com/Finance/US_AHTTP_ENTREPRENEUR_H_NEW_LIVE/1405612741-airbnb-why-new-logo_original.jpg",
//       "name": "Airbnb",
//       "whyLink": "https://boycott.thewitness.news/target/airbnb",
//       "productName": "Airbnb",
//       "productDescription": "Airbnb",
//       "categories": [
//         "TECHNOLOGY",
//         "TRAVEL"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.amnesty.org/en/latest/press-release/2020/12/airbnb-listing-company-is-deeply-compromised-by-israeli-settlement-properties/"
//     },
//     {
//       "logo": "https://images.ctfassets.net/aqfuj2z95p5p/6wCF01XuXegMHkkBZ3hao3/7943e9f78c73c7cc28d8b9bccf329fce/Always_EN_UK_Homepage_Always-logo-OG.jpg",
//       "name": "Always",
//       "whyLink": "https://boycott.thewitness.news/target/always",
//       "productName": "Always",
//       "productDescription": "Always",
//       "categories": [
//         "HEALTHCARE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://1000logos.net/wp-content/uploads/2016/10/Amazon-logo-meaning.jpg",
//       "name": "Amazon",
//       "whyLink": "https://boycott.thewitness.news/target/amazon",
//       "productName": "Amazon",
//       "productDescription": "Amazon",
//       "categories": [
//         "TECHNOLOGY"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.reuters.com/technology/amazon-invest-72-bln-israel-launches-aws-cloud-region-2023-08-01/"
//     },
//     {
//       "logo": "https://logonoid.com/images/ambi-pur-logo.jpg",
//       "name": "Ambipur",
//       "whyLink": "https://boycott.thewitness.news/target/ambipur",
//       "productName": "Ambipur",
//       "productDescription": "Ambipur",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://logowik.com/content/uploads/images/american-eagle-outfitters7114.jpg",
//       "name": "American Eagle",
//       "whyLink": "https://boycott.thewitness.news/target/americaneagle",
//       "productName": "American Eagle",
//       "productDescription": "American Eagle",
//       "categories": [
//         "CLOTHING",
//         "FASHION"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.linkedin.com/posts/craig-brommers-616b1b1_our-updated-american-eagle-times-square-flagship-activity-7116923792202833920-jt6L?utm_source=share&utm_medium=member_desktop"
//     },
//     {
//       "logo": "https://www.loveamika.co.uk/c-images/fb-image.png",
//       "name": "Amika",
//       "whyLink": "https://boycott.thewitness.news/target/amika",
//       "productName": "Amika",
//       "productDescription": "Amika",
//       "categories": [
//         "COSMETICS",
//         "HEALTHCARE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://heatmakessense.zendesk.com/hc/en-us/articles/4406612273563-Where-are-amika-products-made-"
//     },
//     {
//       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/appletiser-logo.png",
//       "name": "Appletiser",
//       "whyLink": "https://boycott.thewitness.news/target/appletiser",
//       "productName": "Appletiser",
//       "productDescription": "Appletiser",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
//     },
//     {
//       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/072017/untitled-4_4.png",
//       "name": "Aquafina",
//       "whyLink": "https://boycott.thewitness.news/target/aquafina",
//       "productName": "Aquafina",
//       "productDescription": "Aquafina",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
//     },
//     {
//       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/aquarius-logo.png",
//       "name": "Aquarius",
//       "whyLink": "https://boycott.thewitness.news/target/aquarius",
//       "productName": "Aquarius",
//       "productDescription": "Aquarius",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
//     },
//     {
//       "logo": "https://static.wikia.nocookie.net/logopedia/images/2/29/Ariel_logo_2006.png",
//       "name": "Ariel",
//       "whyLink": "https://boycott.thewitness.news/target/ariel",
//       "productName": "Ariel",
//       "productDescription": "Ariel",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://images.ctfassets.net/zyvr84rwvj68/34O3XfqFR60G6mcU6mooyq/d599d420ba23eedf3751029bce22ff43/Aussie.jpg",
//       "name": "Aussie",
//       "whyLink": "https://boycott.thewitness.news/target/aussie",
//       "productName": "Aussie",
//       "productDescription": "Aussie",
//       "categories": [
//         "COSMETICS",
//         "HEALTHCARE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://i0.wp.com/fourteenten.com/wp-content/uploads/2017/03/AVIVA-Client-Logo-Image.png",
//       "name": "Aviva",
//       "whyLink": "https://boycott.thewitness.news/target/aviva",
//       "productName": "Aviva",
//       "productDescription": "Aviva",
//       "categories": [
//         "FINANCE",
//         "INSURANCE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.ethicalconsumer.org/money-finance/israel-deadly-investments"
//     },
//     {
//       "logo": "https://www.tabletalkmedia.co.uk/wp-content/uploads/2015/03/axa.png",
//       "name": "AXA",
//       "whyLink": "https://boycott.thewitness.news/target/axa",
//       "productName": "AXA",
//       "productDescription": "AXA",
//       "categories": [
//         "INSURANCE",
//         "FINANCE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://bdsmovement.net/news/axa-continues-investments-in-israeli-apartheid-boycott-axa-now"
//     },
//     {
//       "logo": "https://cdn.sanity.io/images/92ui5egz/production/b953900d039e64d54e396b500343f64065fe3f62-280x280.jpg?w=375&h=375&fit=crop&auto=format",
//       "name": "Axe",
//       "whyLink": "https://boycott.thewitness.news/target/axe",
//       "productName": "Axe",
//       "productDescription": "Axe",
//       "categories": [
//         "HEALTHCARE",
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
//     },
//     {
//       "logo": "https://rocketandcloud.co.uk/wp-content/uploads/2022/02/bae-logo-6-1-550x360.png",
//       "name": "BAE Systems",
//       "whyLink": "https://boycott.thewitness.news/target/bae",
//       "productName": "BAE Systems",
//       "productDescription": "BAE Systems",
//       "categories": [
//         "WEAPONS",
//         "MANUFACTURER"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.baesystems.com/en/product/electronic-warfare-and-support-equipment#:~:text=BAE%20Systems%20Rokar%20is%20the%20sole%20supplier%20of%20these%20systems%20to%20the%20Israeli%20Air%20Force."
//     },
//     {
//       "logo": "https://icons.veryicon.com/png/o/business/bank-logo-collection/bank-of-america-logo.png",
//       "name": "Bank of America",
//       "whyLink": "https://boycott.thewitness.news/target/bankofamerica",
//       "productName": "Bank of America",
//       "productDescription": "Bank of America",
//       "categories": [
//         "FINANCE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://breachmedia.ca/revealed-bmo-bankrolled-israeli-weapons-maker-with-a-90m-loan/"
//     },
//     {
//       "logo": "https://bayviewleasidebia.com/wp-content/uploads/2022/08/BMO.png",
//       "name": "Bank of Montreal",
//       "whyLink": "https://boycott.thewitness.news/target/bankofmontreal",
//       "productName": "Bank of Montreal",
//       "productDescription": "Bank of Montreal",
//       "categories": [
//         "FINANCE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://breachmedia.ca/revealed-bmo-bankrolled-israeli-weapons-maker-with-a-90m-loan/"
//     },
//     {
//       "logo": "https://www.openbanking.org.uk/wp-content/uploads/2021/04/Barclays-Bank-logo.png",
//       "name": "Barclays",
//       "whyLink": "https://boycott.thewitness.news/target/barclays",
//       "productName": "Barclays",
//       "productDescription": "Barclays",
//       "categories": [
//         "INSURANCE",
//         "FINANCE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.ethicalconsumer.org/money-finance/israel-deadly-investments"
//     },
//     {
//       "logo": "https://i.pinimg.com/originals/b1/df/c2/b1dfc2670f0ba2913a3aaca3b12630ae.jpg",
//       "name": "Bath & Body Works",
//       "whyLink": "https://boycott.thewitness.news/target/bathbodyworks",
//       "productName": "Bath & Body Works",
//       "productDescription": "Bath & Body Works",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/the-relationship-between-epstein-and-jewish-philanthropist-wexner-explained/"
//     },
//     {
//       "logo": "https://download.logo.wine/logo/Bayer/Bayer-Logo.wine.png",
//       "name": "Bayer Pharmaceuticals",
//       "whyLink": "https://boycott.thewitness.news/target/bayer",
//       "productName": "Bayer Pharmaceuticals",
//       "productDescription": "Bayer Pharmaceuticals",
//       "categories": [
//         "PHARMACEUTICALS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/pharma-giant-bayer-scouts-israeli-startup-scene-in-search-of-competitive-edge/"
//     },
//     {
//       "logo": "https://cdn.sanity.io/images/92ui5egz/production/bdfd6b3653902d668fa8fa5c430ab63be1676271-280x280.png?w=375&h=375&fit=crop&auto=format",
//       "name": "Ben & Jerry's",
//       "whyLink": "https://boycott.thewitness.news/target/benandjerrys",
//       "productName": "Ben & Jerry's",
//       "productDescription": "Ben & Jerry's",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
//     },
//     {
//       "logo": "https://i.pinimg.com/originals/65/91/ac/6591ace8410edaa621889844694846ad.png",
//       "name": "Benefit Cosmetics",
//       "whyLink": "https://boycott.thewitness.news/target/benefitcosmetics",
//       "productName": "Benefit Cosmetics",
//       "productDescription": "Benefit Cosmetics",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
//     },
//     {
//       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0000/0889/brand.gif",
//       "name": "BIOTHERM",
//       "whyLink": "https://boycott.thewitness.news/target/biotherm",
//       "productName": "BIOTHERM",
//       "productDescription": "BIOTHERM",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
//     },
//     {
//       "logo": "https://www.fintechfutures.com/files/2017/04/BNP-Paribas.png",
//       "name": "BNP Paribas",
//       "whyLink": "https://boycott.thewitness.news/target/bnpparibas",
//       "productName": "BNP Paribas",
//       "productDescription": "BNP Paribas",
//       "categories": [
//         "FINANCE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://breachmedia.ca/revealed-bmo-bankrolled-israeli-weapons-maker-with-a-90m-loan/"
//     },
//     {
//       "logo": "https://yt3.googleusercontent.com/ytc/APkrFKYxzT0Ta2tKaKQmlN707g61WXokGqJK1oaGZHFmVw=s900-c-k-c0x00ffffff-no-rj",
//       "name": "Bobbi Brown",
//       "whyLink": "https://boycott.thewitness.news/target/bobbibrown",
//       "productName": "Bobbi Brown",
//       "productDescription": "Bobbi Brown",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.jnf.org/menu-3/speakers-bureau/bio-page?id=830973c9-caae-67a8-a4cf-ff000038378d"
//     },
//     {
//       "logo": "https://marvel-b1-cdn.bc0a.com/f00000000163918/www.care.org/wp-content/uploads/2021/10/Boeing.png",
//       "name": "Boeing",
//       "whyLink": "https://boycott.thewitness.news/target/boeing",
//       "productName": "Boeing",
//       "productDescription": "Boeing",
//       "categories": [
//         "WEAPONS",
//         "MANUFACTURER"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://investigate.afsc.org/company/boeing"
//     },
//     {
//       "logo": "https://images.ctfassets.net/zyvr84rwvj68/6LLHcCt51Sc0m0s4SigqAE/dd76765a1e15c755772c625f9c171fe0/Bold-2in1.jpg",
//       "name": "Bold",
//       "whyLink": "https://boycott.thewitness.news/target/bold",
//       "productName": "Bold",
//       "productDescription": "Bold",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://www.bookingholdings.com/wp-content/uploads/2020/11/bkng_brands-fullyopen-booking.com_-1.svg",
//       "name": "Booking.com",
//       "whyLink": "https://boycott.thewitness.news/target/booking",
//       "productName": "Booking.com",
//       "productDescription": "Booking.com",
//       "categories": [
//         "TECHNOLOGY",
//         "TRAVEL"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.aljazeera.com/news/2022/10/5/is-booking-com-reversal-palestine-corporate-hypocrisy"
//     },
//     {
//       "logo": "https://bp.com/content/dam/bp/business-sites/en/global/corporate/images-jpg-png/who-we-are/bp-helios-card.png",
//       "name": "BP (British Petroleum)",
//       "whyLink": "https://boycott.thewitness.news/target/bp",
//       "productName": "BP (British Petroleum)",
//       "productDescription": "BP (British Petroleum)",
//       "categories": [
//         "ENERGY"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.reuters.com/business/energy/israel-awards-gas-exploration-licences-eni-bp-four-others-2023-10-29/"
//     },
//     {
//       "logo": "https://images.easyfundraising.org.uk/retailer/cropped/logo-braun-household-uk-1685708000.jpg",
//       "name": "Braun",
//       "whyLink": "https://boycott.thewitness.news/target/braun",
//       "productName": "Braun",
//       "productDescription": "Braun",
//       "categories": [
//         "HEALTHCARE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://i.pinimg.com/474x/7f/c8/da/7fc8da6228e191ea00825ce5f374e565.jpg",
//       "name": "Bulgari / Bvlgari",
//       "whyLink": "https://boycott.thewitness.news/target/bulgari",
//       "productName": "Bulgari / Bvlgari",
//       "productDescription": "Bulgari / Bvlgari",
//       "categories": [
//         "FASHION",
//         "CLOTHING",
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
//     },
//     {
//       "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Burger_King_logo_%281994%29.svg/2111px-Burger_King_logo_%281994%29.svg.png",
//       "name": "Burger King",
//       "whyLink": "https://boycott.thewitness.news/target/burgerking",
//       "productName": "Burger King",
//       "productDescription": "Burger King",
//       "categories": [
//         "FOOD",
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.instagram.com/p/CyORRWHIqeH/"
//     },
//     {
//       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/buxton-logo-round.png",
//       "name": "Buxton",
//       "whyLink": "https://boycott.thewitness.news/target/buxton",
//       "productName": "Buxton",
//       "productDescription": "Buxton",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
//     },
//     {
//       "logo": "https://www.capitalone.co.uk/cloud_assets/png/capital-one-logo.png",
//       "name": "Capital One",
//       "whyLink": "https://boycott.thewitness.news/target/capitalone",
//       "productName": "Capital One",
//       "productDescription": "Capital One",
//       "categories": [
//         "FINANCE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://breachmedia.ca/revealed-bmo-bankrolled-israeli-weapons-maker-with-a-90m-loan/"
//     },
//     {
//       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/asset-library/publishingimages/brands/dairy/carnation-logo-round.png",
//       "name": "Carnation",
//       "whyLink": "https://boycott.thewitness.news/target/carnation",
//       "productName": "Carnation",
//       "productDescription": "Carnation",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
//     },
//     {
//       "logo": "https://logowik.com/content/uploads/images/210_carrefour.jpg",
//       "name": "Carrefour",
//       "whyLink": "https://boycott.thewitness.news/target/carrefour",
//       "productName": "Carrefour",
//       "productDescription": "Carrefour",
//       "categories": [
//         "FOOD",
//         "DRINKS",
//         "HOUSEHOLD",
//         "CLOTHING",
//         "TECHNOLOGY"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.carrefour.com/en/news/2023/arrivee-de-carrefour-en-israel"
//     },
//     {
//       "logo": "https://s3.eu-west-2.amazonaws.com/img.creativepool.com/files/candidate/portfolio/full/857631.jpg",
//       "name": "Carte D'Or Ice Creams",
//       "whyLink": "https://boycott.thewitness.news/target/cartedor",
//       "productName": "Carte D'Or Ice Creams",
//       "productDescription": "Carte D'Or Ice Creams",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
//     },
//     {
//       "logo": "https://1000logos.net/wp-content/uploads/2016/11/Colors-of-the-caterpillar-logo.jpg",
//       "name": "Caterpillar",
//       "whyLink": "https://boycott.thewitness.news/target/caterpillar",
//       "productName": "Caterpillar",
//       "productDescription": "Caterpillar",
//       "categories": [
//         "MANUFACTURER",
//         "CLOTHING"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://en.wikipedia.org/wiki/IDF_Caterpillar_D9"
//     },
//     {
//       "logo": null,
//       "name": "Celine",
//       "whyLink": "https://boycott.thewitness.news/target/celine",
//       "productName": "Celine",
//       "productDescription": "Celine",
//       "categories": [
//         "FASHION",
//         "CLOTHING",
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
//     },
//     {
//       "logo": "https://skinmiles.com/wp-content/uploads/2023/10/CeraVe-logo-brand-page-300x300.jpg",
//       "name": "Cerave",
//       "whyLink": "https://boycott.thewitness.news/target/cerave",
//       "productName": "Cerave",
//       "productDescription": "Cerave",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
//     },
//     {
//       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/102013/chanel_black.png",
//       "name": "Chanel",
//       "whyLink": "https://boycott.thewitness.news/target/chanel",
//       "productName": "Chanel",
//       "productDescription": "Chanel",
//       "categories": [
//         "COSMETICS",
//         "CLOTHING",
//         "FASHION"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.universityoffashion.com/blog/#:~:text=Chanel%20was%20donating%20%244%20million"
//     },
//     {
//       "logo": "https://www.cheapflights.co.uk/news/wp-content/uploads/sites/138/2020/03/default-post-thumbnail-1640x1312.png",
//       "name": "Cheapflights",
//       "whyLink": "https://boycott.thewitness.news/target/cheapflights",
//       "productName": "Cheapflights",
//       "productDescription": "Cheapflights",
//       "categories": [
//         "TECHNOLOGY",
//         "TRAVEL"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.aljazeera.com/news/2022/10/5/is-booking-com-reversal-palestine-corporate-hypocrisy"
//     },
//     {
//       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/cereals-cheerios-logo.png",
//       "name": "Cheerios",
//       "whyLink": "https://boycott.thewitness.news/target/cheerios",
//       "productName": "Cheerios",
//       "productDescription": "Cheerios",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
//     },
//     {
//       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0010/0838/brand.gif",
//       "name": "Cheetos",
//       "whyLink": "https://boycott.thewitness.news/target/cheetos",
//       "productName": "Cheetos",
//       "productDescription": "Cheetos",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
//     },
//     {
//       "logo": "https://cdn.sanity.io/images/92ui5egz/production/5b3550003de32697bef8264cca1e4e222dab891e-1920x1080.jpg?rect=420,0,1080,1080&w=375&h=375&fit=crop&auto=format",
//       "name": "Cif",
//       "whyLink": "https://boycott.thewitness.news/target/cif",
//       "productName": "Cif",
//       "productDescription": "Cif",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
//     },
//     {
//       "logo": "https://i.pinimg.com/280x280_RS/e5/76/34/e5763410888540ccff2a9f8d4c18dacc.jpg",
//       "name": "Clear Blue",
//       "whyLink": "https://boycott.thewitness.news/target/clearblue",
//       "productName": "Clear Blue",
//       "productDescription": "Clear Blue",
//       "categories": [
//         "HEALTHCARE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0001/5427/brand.gif?Gt6PPdgJuur6AEtnU2Im_sunXs3XuZbo&itok=o_eLBdUe",
//       "name": "Clinique",
//       "whyLink": "https://boycott.thewitness.news/target/clinique",
//       "productName": "Clinique",
//       "productDescription": "Clinique",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.jnf.org/menu-3/speakers-bureau/bio-page?id=830973c9-caae-67a8-a4cf-ff000038378d"
//     },
//     {
//       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/coca-cola-logo.png",
//       "name": "Coca-Cola",
//       "whyLink": "https://boycott.thewitness.news/target/cocacola",
//       "productName": "Coca-Cola",
//       "productDescription": "Coca-Cola",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
//     },
//     {
//       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/coffee-mate-logo-round_7.png",
//       "name": "Coffee Mate",
//       "whyLink": "https://boycott.thewitness.news/target/coffeemate",
//       "productName": "Coffee Mate",
//       "productDescription": "Coffee Mate",
//       "categories": [
//         "COFFEE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
//     },
//     {
//       "logo": "https://cdn.sanity.io/images/92ui5egz/production/a8c2ae9b3e2c4dae8c7223a81b8dd49f98cfd266-1080x1080.png?w=375&h=375&fit=crop&auto=format",
//       "name": "Comfort",
//       "whyLink": "https://boycott.thewitness.news/target/comfort",
//       "productName": "Comfort",
//       "productDescription": "Comfort",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
//     },
//     {
//       "logo": "https://images.crunchbase.com/image/upload/c_lpad,f_auto,q_auto:eco,dpr_1/ik2bctvydwmkecjghspk",
//       "name": "Conservative party",
//       "whyLink": "https://boycott.thewitness.news/target/conservative",
//       "productName": "Conservative party",
//       "productDescription": "Conservative party",
//       "categories": [
//         "POLITICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.theguardian.com/world/2023/oct/14/sunak-promises-israel-unqualified-support-in-face-of-evil-but-fails-to-mention-plight-of-gaza/"
//     },
//     {
//       "logo": "https://cdn.sanity.io/images/92ui5egz/production/911b7828e3d316d99652c1e2792bea6e70fbf5df-1080x1080.png?w=375&h=375&fit=crop&auto=format",
//       "name": "Cornetto Ice Creams",
//       "whyLink": "https://boycott.thewitness.news/target/cornetto",
//       "productName": "Cornetto Ice Creams",
//       "productDescription": "Cornetto Ice Creams",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
//     },
//     {
//       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/costa-logo.png",
//       "name": "Costa Coffee",
//       "whyLink": "https://boycott.thewitness.news/target/costacoffee",
//       "productName": "Costa Coffee",
//       "productDescription": "Costa Coffee",
//       "categories": [
//         "COFFEE",
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
//     },
//     {
//       "logo": null,
//       "name": "Curver",
//       "whyLink": "https://boycott.thewitness.news/target/curver",
//       "productName": "Curver",
//       "productDescription": "Curver",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.whoprofits.org/companies/company/4060"
//     },
//     {
//       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/dasani-logo.png",
//       "name": "Dasani Water",
//       "whyLink": "https://boycott.thewitness.news/target/dasani",
//       "productName": "Dasani Water",
//       "productDescription": "Dasani Water",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
//     },
//     {
//       "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dell_logo_2016.svg/1200px-Dell_logo_2016.svg.png",
//       "name": "Dell",
//       "whyLink": "https://boycott.thewitness.news/target/dell",
//       "productName": "Dell",
//       "productDescription": "Dell",
//       "categories": [
//         "TECHNOLOGY"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.bloomberg.com/news/articles/2014-11-07/ellison-adelson-donate-to-israeli-soldiers?leadSource=uverify%20wall"
//     },
//     {
//       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0012/4528/brand.gif",
//       "name": "Diesel Frangrances",
//       "whyLink": "https://boycott.thewitness.news/target/diesel",
//       "productName": "Diesel Frangrances",
//       "productDescription": "Diesel Frangrances",
//       "categories": [
//         "COSMETICS",
//         "CLOTHING",
//         "FASHION"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
//     },
//     {
//       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/dietCoke_transparency.png",
//       "name": "Diet Coke",
//       "whyLink": "https://boycott.thewitness.news/target/dietcoke",
//       "productName": "Diet Coke",
//       "productDescription": "Diet Coke",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
//     },
//     {
//       "logo": "https://dynl.mktgcdn.com/p/KfI5g-nDtylqhtl1RdhWzG0DMJ7sGl0lGfr3EARlPtQ/500x500.jpg",
//       "name": "Dior / Christian Dior",
//       "whyLink": "https://boycott.thewitness.news/target/dior",
//       "productName": "Dior / Christian Dior",
//       "productDescription": "Dior / Christian Dior",
//       "categories": [
//         "FASHION",
//         "CLOTHING",
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
//     },
//     {
//       "logo": "https://www.trustedreviews.com/wp-content/uploads/sites/54/2022/02/Disney-Plus-logo-920x518.jpg",
//       "name": "Disney",
//       "whyLink": "https://boycott.thewitness.news/target/disney",
//       "productName": "Disney",
//       "productDescription": "Disney",
//       "categories": [
//         "ENTERTAINMENT",
//         "TECHNOLOGY",
//         "MEDIA"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.yahoo.com/entertainment/disney-pledges-2-million-donation-032004758.html"
//     },
//     {
//       "logo": "https://cdn.freebiesupply.com/logos/thumbs/2x/dkny-2-logo.png",
//       "name": "DKNY",
//       "whyLink": "https://boycott.thewitness.news/target/dkny",
//       "productName": "DKNY",
//       "productDescription": "DKNY",
//       "categories": [
//         "FASHION",
//         "CLOTHING",
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
//     },
//     {
//       "logo": "https://cdn.sanity.io/images/92ui5egz/production/9c1c07e7e468bc88ebf369dce27e46fb8134b330-1080x1080.jpg?w=375&h=375&fit=crop&auto=format",
//       "name": "Domestos",
//       "whyLink": "https://boycott.thewitness.news/target/domestos",
//       "productName": "Domestos",
//       "productDescription": "Domestos",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
//     },
//     {
//       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0019/5529/brand.gif",
//       "name": "Doritos",
//       "whyLink": "https://boycott.thewitness.news/target/doritos",
//       "productName": "Doritos",
//       "productDescription": "Doritos",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
//     },
//     {
//       "logo": "https://cdn.sanity.io/images/92ui5egz/production/db75ae243befa00aa3cdb2eaf546b0c3aa2ab5d2-1080x1080.jpg?w=375&h=375&fit=crop&auto=format",
//       "name": "Dove",
//       "whyLink": "https://boycott.thewitness.news/target/dove",
//       "productName": "Dove",
//       "productDescription": "Dove",
//       "categories": [
//         "HEALTHCARE",
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
//     },
//     {
//       "logo": "https://www.coca-cola.com/content/dam/onexp/gb/en/logos/v2/uk_dr_pepper_logo_286x180.png",
//       "name": "Dr Pepper",
//       "whyLink": "https://boycott.thewitness.news/target/drpepper",
//       "productName": "Dr Pepper",
//       "productDescription": "Dr Pepper",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
//     },
//     {
//       "logo": "https://images.crunchbase.com/image/upload/c_lpad,h_256,w_256,f_auto,q_auto:eco,dpr_1/v1469615776/asjzj7thdsrcofxhgz3l.png",
//       "name": "Eden Springs",
//       "whyLink": "https://boycott.thewitness.news/target/edensprings",
//       "productName": "Eden Springs",
//       "productDescription": "Eden Springs",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://bdsmovement.net/news/bds-victory-against-eden-springs"
//     },
//     {
//       "logo": "https://static.stocktitan.net/company-logo/ESLT-lg.png",
//       "name": "Elbit Systems",
//       "whyLink": "https://boycott.thewitness.news/target/elbit",
//       "productName": "Elbit Systems",
//       "productDescription": "Elbit Systems",
//       "categories": [
//         "WEAPONS",
//         "MANUFACTURER"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://elbitsystems.com/about-us-introduction/"
//     },
//     {
//       "logo": "https://logowik.com/content/uploads/images/550_estee_lauder.jpg",
//       "name": "Estee Lauder",
//       "whyLink": "https://boycott.thewitness.news/target/esteelauder",
//       "productName": "Estee Lauder",
//       "productDescription": "Estee Lauder",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.jnf.org/menu-3/speakers-bureau/bio-page?id=830973c9-caae-67a8-a4cf-ff000038378d"
//     },
//     {
//       "logo": "https://upload.wikimedia.org/wikipedia/en/5/59/Fairy_logo.png",
//       "name": "Fairy",
//       "whyLink": "https://boycott.thewitness.news/target/fairy",
//       "productName": "Fairy",
//       "productDescription": "Fairy",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/fanta-logo.png",
//       "name": "Fanta",
//       "whyLink": "https://boycott.thewitness.news/target/fanta",
//       "productName": "Fanta",
//       "productDescription": "Fanta",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
//     },
//     {
//       "logo": "https://upload.wikimedia.org/wikipedia/commons/7/72/Febreze_Logo.svg",
//       "name": "Febreze",
//       "whyLink": "https://boycott.thewitness.news/target/febreze",
//       "productName": "Febreze",
//       "productDescription": "Febreze",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/felix-logo-square-2023.png",
//       "name": "Felix",
//       "whyLink": "https://boycott.thewitness.news/target/felix",
//       "productName": "Felix",
//       "productDescription": "Felix",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
//     },
//     {
//       "logo": "https://i.pinimg.com/originals/c4/6a/bc/c46abcf81b48d73f67a371033f2a8699.png",
//       "name": "Fendi",
//       "whyLink": "https://boycott.thewitness.news/target/fendi",
//       "productName": "Fendi",
//       "productDescription": "Fendi",
//       "categories": [
//         "FASHION",
//         "CLOTHING",
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
//     },
//     {
//       "logo": "https://seeklogo.com/images/F/fenty-logo-C76A749839-seeklogo.com.png",
//       "name": "Fenty Beauty by Rihanna",
//       "whyLink": "https://boycott.thewitness.news/target/fenty",
//       "productName": "Fenty Beauty by Rihanna",
//       "productDescription": "Fenty Beauty by Rihanna",
//       "categories": [
//         "FASHION",
//         "CLOTHING",
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
//     },
//     {
//       "logo": "https://mms.businesswire.com/media/20230510006090/en/827135/22/Fiverr_September_2020_Logo.jpg",
//       "name": "Fiverr",
//       "whyLink": "https://boycott.thewitness.news/target/fiverr",
//       "productName": "Fiverr",
//       "productDescription": "Fiverr",
//       "categories": [
//         "TECHNOLOGY"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://twitter.com/michakaufman"
//     },
//     {
//       "logo": null,
//       "name": "Flash",
//       "whyLink": "https://boycott.thewitness.news/target/flash",
//       "productName": "Flash",
//       "productDescription": "Flash",
//       "categories": [
//         "HOUSEHOLD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://www.infologue.com/wp-content/uploads/2021/08/G4S-Logo.png",
//       "name": "G4S",
//       "whyLink": "https://boycott.thewitness.news/target/g4s",
//       "productName": "G4S",
//       "productDescription": "G4S",
//       "categories": [
//         "CONTRACTOR"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://peoplesdispatch.org/2023/06/05/private-security-firm-g4s-to-divest-from-israel-after-years-long-campaign-by-bds-activists/"
//     },
//     {
//       "logo": "https://media.giphy.com/avatars/MTNDEWGAMEFUEL/igP0vcVwmx8u.png",
//       "name": "Game Fuel",
//       "whyLink": "https://boycott.thewitness.news/target/gamefuel",
//       "productName": "Game Fuel",
//       "productDescription": "Game Fuel",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
//     },
//     {
//       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/072019/garnier_logo.jpg?Hc_rMssrG43ZcRMFKa6QdUcGRKyr5oP8&itok=TPiNcSQp",
//       "name": "Garnier",
//       "whyLink": "https://boycott.thewitness.news/target/garnier",
//       "productName": "Garnier",
//       "productDescription": "Garnier",
//       "categories": [
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
//     },
//     {
//       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0019/1244/brand.gif",
//       "name": "Gatorade",
//       "whyLink": "https://boycott.thewitness.news/target/gatorade",
//       "productName": "Gatorade",
//       "productDescription": "Gatorade",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
//     },
//     {
//       "logo": "https://i.pinimg.com/736x/20/47/b8/2047b8ff614a863dba63d27a54a0a1fb.jpg",
//       "name": "Gillette",
//       "whyLink": "https://boycott.thewitness.news/target/gillette",
//       "productName": "Gillette",
//       "productDescription": "Gillette",
//       "categories": [
//         "HEALTHCARE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTihVZ6h9Are1xzGGeBlltY1uVSlkblolMzowx4AV7hEXFYMawBy7krb_Ut0Tm7w8RfgNw&usqp=CAU",
//       "name": "Giorgio Armani Beauty",
//       "whyLink": "https://boycott.thewitness.news/target/giorgioarmani",
//       "productName": "Giorgio Armani Beauty",
//       "productDescription": "Giorgio Armani Beauty",
//       "categories": [
//         "COSMETICS",
//         "CLOTHING",
//         "FASHION"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
//     },
//     {
//       "logo": "https://i.pinimg.com/originals/3d/a0/35/3da0354353d0d7dc17f95af8ebc3efb8.png",
//       "name": "Givenchy",
//       "whyLink": "https://boycott.thewitness.news/target/givenchy",
//       "productName": "Givenchy",
//       "productDescription": "Givenchy",
//       "categories": [
//         "FASHION",
//         "CLOTHING",
//         "COSMETICS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
//     },
//     {
//       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/smartwater-logo.png",
//       "name": "Glaceau Smartwater",
//       "whyLink": "https://boycott.thewitness.news/target/glaceuasmartwater",
//       "productName": "Glaceau Smartwater",
//       "productDescription": "Glaceau Smartwater",
//       "categories": [
//         "DRINKS"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
//     },
//     {
//       "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/1200px-Google_%22G%22_Logo.svg.png",
//       "name": "Google",
//       "whyLink": "https://boycott.thewitness.news/target/google",
//       "productName": "Google",
//       "productDescription": "Google",
//       "categories": [
//         "TECHNOLOGY"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.theguardian.com/commentisfree/2021/oct/12/google-amazon-workers-condemn-project-nimbus-israeli-military-contra"
//     },
//     {
//       "logo": "https://logowik.com/content/uploads/images/head-shoulders7079.jpg",
//       "name": "Head and Shoulders",
//       "whyLink": "https://boycott.thewitness.news/target/headandshoulders",
//       "productName": "Head and Shoulders",
//       "productDescription": "Head and Shoulders",
//       "categories": [
//         "COSMETICS",
//         "HEALTHCARE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
//       "logo": "https://cdn.sanity.io/images/92ui5egz/production/8fe76fd805ab71155fd402e9a90e584e36231910-1080x1080.png?w=375&h=375&fit=crop&auto=format",
//       "name": "Hellman's",
//       "whyLink": "https://boycott.thewitness.news/target/hellmans",
//       "productName": "Hellman's",
//       "productDescription": "Hellman's",
//       "categories": [
//         "FOOD"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
//     },
//     {
//       "logo": "https://crueltyfree.peta.org/wp-content/uploads/herbal-essences-scaled.jpg",
//       "name": "Herbal Essences",
//       "whyLink": "https://boycott.thewitness.news/target/herbalessences",
//       "productName": "Herbal Essences",
//       "productDescription": "Herbal Essences",
//       "categories": [
//         "COSMETICS",
//         "HEALTHCARE"
//       ],
//       "explanationText": null,
//       "alternatives": null,
//       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
//     },
//     {
    //       "logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQMAAADDCAMAAACxkIT5AAAAe1BMVEX///8AAABhYWFAQED6+vr19fXv7++Xl5f7+/tkZGTs7OzPz8/y8vK/v7/39/esrKyRkZHg4ODm5ubY2Ng4ODh9fX2CgoJNTU2Li4vHx8dwcHAzMzOwsLAaGhp2dnZbW1ssLCyenp4fHx8TExNUVFQjIyNDQ0O5ubmjo6OD7WlqAAAHn0lEQVR4nO2caUPqOhCGTxFEkEU2ERTZxf//C68cyeRtM0kKF+2EM88321A702QyW/vnj6IoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoiqIoN0hj3lq25pPnp/7joFP1zVTEIbMsPt7fBlXf0K/Q6Dbhr2VW5L3bqOzefofZPMtABx1HBUdas+pu8KfpNBdHEYf2yCergyzbNu+ru80fZDj5lm8Kx+48OjiuiaH3SqnSmRjh3uzBgV8FRy3c1lyoN61odXv4JaiDLHvqVXfL12a2t3LN4fgqooNscyvWsT5HsUCqx5gKvmjdxFR4XKBMe1gK7yV0kG1vYCo08yI9w6kyKvjiqbJ7vw71WkGgkT13YCVmWCa9HjrjgjgbOFlUj5/XhHfJ4aIozdqebJdWwZdRSDaWYlygtj3r85N5Rv5/I5mhK8kOTgf8ZI4kZwKjAvSTudO3poSGYwu+gNTA07k62KaXZ/pgxGjB+aif7DB+qEyYy5hzUpzpJ4dUmAC80YcBE3ZAhLX3/wlkxIrwYgfUL1FBlj1WJ9K5PLyyEsAe371MB6t0vOZnVoAxjHDzyeV4r0ymM+FXAq7m+wtVkM5q8HiA4Cf3L9bBa3VinYMnEMB88vRiHaSxN/Q8N186nxwhBXfR5wR34kNK8ez/11JoeG4d88kfd4ZijuUrLLAnka0dIT+h0nSk+qYLY6zj/9B4bOXHNd1LHmmMaMN94UfIoceFi0f8P8mHDv4S29B4XtItwptHBaFVjEqYBsaZ7Fv/2jd9ZXgvOZILA7/yLTTupOD9dW/52vh2vXHZX9WDA8sotHJ8VVSPpTPQuEiK4ORbTa53wz+ALzsElq53fwJ+RuMgy/JwAmfGaQ/Zh2dLtXiiJbbvYgXHzLiNFW6wH//ldQnjjI8tOXLyOYCcn9xkjsEkJzuJAYI5JtlF8MVCMHfJh+Lakqyx65FjCOEmbaJ3vyDLhfgyZGjpjHeMO4VRHVQjqSBbg3E2CSk3nzTz6AAsHVkMbnnAtN+ZY7D0ISJFz1sWa14FG3hq9Ci5MNIuD6pCLeDykISM7LUV4skS4nZujuHyMEsfqpHkZ6CwEF2FXOpq2fA64PLJMJnJ0sHyIIsIlhOTkNufF+Yy+M7b3HSmRwl1M2pLsjsAGRYsVOeSkLBbiCKeT6a+C1getAvC8qBFhbYvF45JDRk8NUSYzn1GBGZ52BYVuHq+WC+1W41vssLpbByBFRyj5WEPkR+F/mDeBw3G2BWyZnXA9V2AtSdLB1kW+i32XeQzE1I3Rz5whviQni/IxiwPWlO4AxaMjdTsMltPR0fA7J0om3m84DvT6jj4Ly618Mj23nKOACQEmTDS+gEYFRQui6l6SbA6gPP0KEE2xk+mKBL9y2KxPiUdwLolRwBDQbMUIBqmugv6AMWmVqk64OwByEHOX3h5kPHDJIHT1CrVHjD7AmYJzKNcQEaF1Ga79mg2YRnBKdZL3RfWrg5gG6foPxxG2nolJl2dBJXUhn7GT+T8ZMiKMH4yFapwxbtNrVJrTW688AFnzaPEKpGJjWB50BPH3LFbyJUaL7hxIzwtzk9mwkjyF3IZAreQKzVudFsPuP7kcBhJKfVPuDATkErNHzh5JK4/mWtLgiwLK6S76YrNIzmODDgCtE7Cy4PMKqqP6WmQm09c52+UdQRgx2OWB6XU0eYxTa1SQ2envgCOwAPnJ7thJM2M3FwvdOsUZpgwCnUmLmHGte/bLAubUuea/QR/JyLnzqEjwCTMuHILV2TkmloF1xvzvgz3vQvMJxtLZ4vrNFuw3s69ESO57pzzks7PJ88++3/5RA+Ia++R3H+AfShc3wV2XNPyiDSVMA2PG8l9KBg+R/LJZOliUTDT6Sa7HwkmLpjuYD45Mq+54pXopQBPDR0Bkx1Dc24s3SpyQaaWvYj8pGoo/D8/nxy+HvAZ/knlNE5b/BZyxxQLcssj/Akg9oUX8Y3rpyAAd3Bz75gHNRvIR/H3QH3ENnVIdg6+OblD01bNQHHQnT1GwsHyaO9qOZZ7V/4jYlMHlthHj7wC+d58KCB7Y/zG9yILC6YJfG8+FBBvDY6sz9ABl2UJIzdzkMP3DgMD/KrcW+CrimQ6l/Lv9cParnssYAGpOXWHUh/AOsJVI4NILbW69Mo901wYyX40oshGbp+yQ8nVAEXDch9EEB4s5Sm310MY6XsfLkcie4KByQU7YBhZ5i3wmve/yaReYoPkyi0BEvoIxokSn3mAMHJdQgdJOIh5oi/449Qu8eEwqZXmIDHn9zw/OUkVxCRbcFkWL0ntikhwOWBG5VZnwZF24Kto8GRjfvI+gbSJn97OKxiMivjJU8EV1lKUeAs8so3Kzx9G8Ux0yCeH/eRkouUQDc5vxmqkf71k2VL6hz/K0nVThZhP9mtge/BfNDV6jlUAS7/2quA5dWOYp523/dhk4Yuu5knviCwD1ELcT54n+B3dErTt63lwlPWTX25vDhDd7zZO7Npz7WWtm9oXdM+kc5gH/eT54VZ2wzAjeM7gPIxb/YRjo//BdLerzScv69nghk2AoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKovyb/AdZ9lL6MpgBeQAAAABJRU5ErkJggg==",
    //       "name": "HP",
    //       "whyLink": "https://boycott.thewitness.news/target/hp",
    //       "productName": "HP",
    //       "productDescription": "HP",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Hewlett-Packard_Israel"
    //     },
    //     {
    //       "logo": "https://www.hsbc.co.uk/etc.clientlibs/dpws/clientlibs-public/clientlib-site/resources/social/logo/Square-1200x1200px.jpg",
    //       "name": "HSBC",
    //       "whyLink": "https://boycott.thewitness.news/target/hsbc",
    //       "productName": "HSBC",
    //       "productDescription": "HSBC",
    //       "categories": [
    //         "INSURANCE",
    //         "FINANCE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.ethicalconsumer.org/money-finance/israel-deadly-investments"
    //     },
    //     {
    //       "logo": "https://seeklogo.com/images/H/Hublot-logo-A48632AE5F-seeklogo.com.png",
    //       "name": "Hublot",
    //       "whyLink": "https://boycott.thewitness.news/target/hublot",
    //       "productName": "Hublot",
    //       "productDescription": "Hublot",
    //       "categories": [
    //         "FASHION",
    //         "LUXURY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://pbs.twimg.com/profile_images/821433960639008768/_M06NaeP_400x400.jpg",
    //       "name": "Hyundai",
    //       "whyLink": "https://boycott.thewitness.news/target/hyundai",
    //       "productName": "Hyundai",
    //       "productDescription": "Hyundai",
    //       "categories": [
    //         "CAR",
    //         "MANUFACTURER"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/boycott-hyundai-end-its-complicity-israel%E2%80%99s-ethnic-cleansing-palestinian-communities-jerusalem"
    //     },
    //     {
    //       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/innocent-logo.png",
    //       "name": "Innocent Smoothies",
    //       "whyLink": "https://boycott.thewitness.news/target/innocent",
    //       "productName": "Innocent Smoothies",
    //       "productDescription": "Innocent Smoothies",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
    //     },
    //     {
    //       "logo": "https://crueltyfree.peta.org/wp-content/uploads/it-cosmetics-logo.jpg",
    //       "name": "IT Cosmetics",
    //       "whyLink": "https://boycott.thewitness.news/target/itcosmetics",
    //       "productName": "IT Cosmetics",
    //       "productDescription": "IT Cosmetics",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://logos-world.net/wp-content/uploads/2021/09/Intel-Logo.png",
    //       "name": "Intel",
    //       "whyLink": "https://boycott.thewitness.news/target/intel",
    //       "productName": "Intel",
    //       "productDescription": "Intel",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.intel.com/content/www/us/en/corporate-responsibility/intel-in-israel.html"
    //     },
    //     {
    //       "logo": "https://image.isu.pub/170203184809-3d22cddc0d5e27dd1d0ea2ce32b57baf/jpg/page_1.jpg",
    //       "name": "Jo Malone",
    //       "whyLink": "https://boycott.thewitness.news/target/jomalone",
    //       "productName": "Jo Malone",
    //       "productDescription": "Jo Malone",
    //       "categories": [
    //         "COSMETICS",
    //         "HOUSEHOLD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.jnf.org/menu-3/speakers-bureau/bio-page?id=830973c9-caae-67a8-a4cf-ff000038378d"
    //     },
    //     {
    //       "logo": "https://www.bookingholdings.com/wp-content/uploads/2018/02/bkng_brands-fullyopen-kayak-1.svg",
    //       "name": "Kayak",
    //       "whyLink": "https://boycott.thewitness.news/target/kayak",
    //       "productName": "Kayak",
    //       "productDescription": "Kayak",
    //       "categories": [
    //         "TECHNOLOGY",
    //         "TRAVEL"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.aljazeera.com/news/2022/10/5/is-booking-com-reversal-palestine-corporate-hypocrisy"
    //     },
    //     {
    //       "logo": "https://logowik.com/content/uploads/images/kenzo8232.jpg",
    //       "name": "Kenzo",
    //       "whyLink": "https://boycott.thewitness.news/target/kenzo",
    //       "productName": "Kenzo",
    //       "productDescription": "Kenzo",
    //       "categories": [
    //         "FASHION",
    //         "CLOTHING",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://static.couponfollow.com/kerastase-ca/logo.png",
    //       "name": "Keratase",
    //       "whyLink": "https://boycott.thewitness.news/target/keratase",
    //       "productName": "Keratase",
    //       "productDescription": "Keratase",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://images.crunchbase.com/image/upload/c_lpad,h_256,w_256,f_auto,q_auto:eco,dpr_1/v1469080356/d4wxa85xv4gueo1nwled.png",
    //       "name": "Keter",
    //       "whyLink": "https://boycott.thewitness.news/target/keter",
    //       "productName": "Keter",
    //       "productDescription": "Keter",
    //       "categories": [
    //         "HOUSEHOLD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.whoprofits.org/companies/company/4060"
    //     },
    //     {
    //       "logo": "https://banner2.cleanpng.com/20180601/xyv/kisspng-colonel-sanders-kfc-dallas-crispy-fried-chicken-kfc-5b112003073f25.1634110215278489630297.jpg",
    //       "name": "KFC",
    //       "whyLink": "https://boycott.thewitness.news/target/kfc",
    //       "productName": "KFC",
    //       "productDescription": "KFC",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.calcalistech.com/ctech/articles/0,7340,L-3901254,00.html"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0023/3652/brand.gif",
    //       "name": "Kiehl's",
    //       "whyLink": "https://boycott.thewitness.news/target/kiehls",
    //       "productName": "Kiehl's",
    //       "productDescription": "Kiehl's",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/kitkat-logo-square-2023.png",
    //       "name": "KitKat",
    //       "whyLink": "https://boycott.thewitness.news/target/kitkat",
    //       "productName": "KitKat",
    //       "productDescription": "KitKat",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://cdn.sanity.io/images/92ui5egz/production/e1b2dfa5598c94587747a2e58c588a8a0eb35580-1080x1080.jpg?w=375&h=375&fit=crop&auto=format",
    //       "name": "Knorr",
    //       "whyLink": "https://boycott.thewitness.news/target/knorr",
    //       "productName": "Knorr",
    //       "productDescription": "Knorr",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://miro.medium.com/v2/resize:fit:1000/1*gSiQUzv3VJq8DVtMiwX93Q.jpeg",
    //       "name": "Kylie Cosmetics",
    //       "whyLink": "https://boycott.thewitness.news/target/kyliecosmetics",
    //       "productName": "Kylie Cosmetics",
    //       "productDescription": "Kylie Cosmetics",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.dailymail.co.uk/tvshowbiz/article-12607295/Kylie-Jenner-posts-deletes-Instagram-Story-showing-support-Israel.html"
    //     },
    //     {
    //       "logo": "https://fontmeme.com/images/Lar-Mer-Logo.jpg",
    //       "name": "La Mer",
    //       "whyLink": "https://boycott.thewitness.news/target/lamer",
    //       "productName": "La Mer",
    //       "productDescription": "La Mer",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.jnf.org/menu-3/speakers-bureau/bio-page?id=830973c9-caae-67a8-a4cf-ff000038378d"
    //     },
    //     {
    //       "logo": "https://www.easypara.co.uk/media/easysoft/home/manufacturer/larocheposay-easyparapharmacie.jpg",
    //       "name": "La Roche-Posay",
    //       "whyLink": "https://boycott.thewitness.news/target/larocheposay",
    //       "productName": "La Roche-Posay",
    //       "productDescription": "La Roche-Posay",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://ih1.redbubble.net/image.977949166.6470/flat,750x,075,f-pad,750x1000,f8f8f8.jpg",
    //       "name": "Labour party",
    //       "whyLink": "https://boycott.thewitness.news/target/labour",
    //       "productName": "Labour party",
    //       "productDescription": "Labour party",
    //       "categories": [
    //         "POLITICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://labour.org.uk/updates/press-releases/keir-starmers-statement-to-the-commons-on-israel-gaza/"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/032011/untitled-1_392.png",
    //       "name": "Lancome",
    //       "whyLink": "https://boycott.thewitness.news/target/lancome",
    //       "productName": "Lancome",
    //       "productDescription": "Lancome",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://logowik.com/content/uploads/images/lavazza9192.logowik.com.webp",
    //       "name": "Lavazza",
    //       "whyLink": "https://boycott.thewitness.news/target/lavazza",
    //       "productName": "Lavazza",
    //       "productDescription": "Lavazza",
    //       "categories": [
    //         "COFFEE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.skysports.com/amp/football/news/11095/12307323/arsenal-speak-to-mohamed-elneny-over-wider-implications-of-pro-palestinian-social-media-post-amid-sponsor-concern"
    //     },
    //     {
    //       "logo": "https://i.pinimg.com/originals/08/15/b3/0815b39bbb315d4aaf50b260de14a653.jpg",
    //       "name": "Lay's",
    //       "whyLink": "https://boycott.thewitness.news/target/lays",
    //       "productName": "Lay's",
    //       "productDescription": "Lay's",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
    //     },
    //     {
    //       "logo": "https://upload.wikimedia.org/wikipedia/commons/3/37/L%26G_Logo_4C_2023.png",
    //       "name": "Legal & General",
    //       "whyLink": "https://boycott.thewitness.news/target/legalgeneral",
    //       "productName": "Legal & General",
    //       "productDescription": "Legal & General",
    //       "categories": [
    //         "FINANCE",
    //         "INSURANCE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.ethicalconsumer.org/money-finance/israel-deadly-investments"
    //     },
    //     {
    //       "logo": "https://www.pattersons.co.uk/media/solwin/ourbrand/brand/image/l/e/lenor.jpg",
    //       "name": "Lenor",
    //       "whyLink": "https://boycott.thewitness.news/target/lenor",
    //       "productName": "Lenor",
    //       "productDescription": "Lenor",
    //       "categories": [
    //         "HOUSEHOLD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/cereals-lion-logo.png",
    //       "name": "Lion",
    //       "whyLink": "https://boycott.thewitness.news/target/lion",
    //       "productName": "Lion",
    //       "productDescription": "Lion",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/012023/lipton.png?fbRyRvf2gy6O8JQcQhfxkr8O.CxRGBk.&itok=uZ6IQzoY",
    //       "name": "Lipton",
    //       "whyLink": "https://boycott.thewitness.news/target/lipton",
    //       "productName": "Lipton",
    //       "productDescription": "Lipton",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
    //     },
    //     {
    //       "logo": "https://upload.wikimedia.org/wikipedia/en/f/fc/LIPTON_PRIMARY_RGB_BMT.png",
    //       "name": "Lipton Iced Tea",
    //       "whyLink": "https://boycott.thewitness.news/target/liptonicedtea",
    //       "productName": "Lipton Iced Tea",
    //       "productDescription": "Lipton Iced Tea",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://www.lloydsbankinggroup.com/assets/images/site-wide/logos/png/lloyds-bank-300.png",
    //       "name": "Lloyds Bank",
    //       "whyLink": "https://boycott.thewitness.news/target/lloyds",
    //       "productName": "Lloyds Bank",
    //       "productDescription": "Lloyds Bank",
    //       "categories": [
    //         "INSURANCE",
    //         "FINANCE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.ethicalconsumer.org/money-finance/israel-deadly-investments"
    //     },
    //     {
    //       "logo": "https://pbs.twimg.com/profile_images/1635287976044548108/tNkqLQPN_400x400.png",
    //       "name": "Lockheed Martin",
    //       "whyLink": "https://boycott.thewitness.news/target/lockheedmartin",
    //       "productName": "Lockheed Martin",
    //       "productDescription": "Lockheed Martin",
    //       "categories": [
    //         "WEAPONS",
    //         "MANUFACTURER"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.lockheedmartin.com/en-il/index.html"
    //     },
    //     {
    //       "logo": "https://logowik.com/content/uploads/images/loewe2671.jpg",
    //       "name": "Loewe",
    //       "whyLink": "https://boycott.thewitness.news/target/loewe",
    //       "productName": "Loewe",
    //       "productDescription": "Loewe",
    //       "categories": [
    //         "FASHION",
    //         "CLOTHING",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0000/2125/brand.gif",
    //       "name": "Loreal / L'oreal",
    //       "whyLink": "https://boycott.thewitness.news/target/loreal",
    //       "productName": "Loreal / L'oreal",
    //       "productDescription": "Loreal / L'oreal",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://media.designrush.com/inspiration_images/136124/conversions/_1519762849_545_990__1513771354_519_louis-v1_b31600c58738-mobile.jpg",
    //       "name": "Louis Vuitton",
    //       "whyLink": "https://boycott.thewitness.news/target/louisvuitton",
    //       "productName": "Louis Vuitton",
    //       "productDescription": "Louis Vuitton",
    //       "categories": [
    //         "FASHION",
    //         "CLOTHING",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://cdn.sanity.io/images/92ui5egz/production/2f8428952599e230782f70a2ca0bfc3e5fa2b270-1080x1080.png?w=375&h=375&fit=crop&auto=format",
    //       "name": "Lux",
    //       "whyLink": "https://boycott.thewitness.news/target/lux",
    //       "productName": "Lux",
    //       "productDescription": "Lux",
    //       "categories": [
    //         "HEALTHCARE",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://r.lvmh-static.com/uploads/2010/01/lvmh_logotype_simple_n-1.jpg",
    //       "name": "LVMH",
    //       "whyLink": "https://boycott.thewitness.news/target/lvmh",
    //       "productName": "LVMH",
    //       "productDescription": "LVMH",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://cdn.sanity.io/images/92ui5egz/production/81a3d4dbeb4e81c5c5443bd3616e23b6333428d4-1080x1080.png?w=375&h=375&fit=crop&auto=format",
    //       "name": "Lynx",
    //       "whyLink": "https://boycott.thewitness.news/target/lynx",
    //       "productName": "Lynx",
    //       "productDescription": "Lynx",
    //       "categories": [
    //         "HEALTHCARE",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/122019/logo-mac_prancheta_1.png?NPZfS4QSWg_6ySGSJKInsSXz2CFRKvhS&itok=2_JpKro7",
    //       "name": "MAC Cosmetics",
    //       "whyLink": "https://boycott.thewitness.news/target/maccosmetics",
    //       "productName": "MAC Cosmetics",
    //       "productDescription": "MAC Cosmetics",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.jnf.org/menu-3/speakers-bureau/bio-page?id=830973c9-caae-67a8-a4cf-ff000038378d"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/maggi-logo-round-2022.png",
    //       "name": "Maggi",
    //       "whyLink": "https://boycott.thewitness.news/target/maggi",
    //       "productName": "Maggi",
    //       "productDescription": "Maggi",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://cdn.sanity.io/images/92ui5egz/production/26b76dc0a16aa60339c059b31babcb45a6d1409a-1080x1080.jpg?w=375&h=375&fit=crop&auto=format",
    //       "name": "Magnum Ice Creams",
    //       "whyLink": "https://boycott.thewitness.news/target/magnum",
    //       "productName": "Magnum Ice Creams",
    //       "productDescription": "Magnum Ice Creams",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://perfumesociety.org/wp-content/uploads/2014/04/FRANCIS-KURK-1.jpg",
    //       "name": "Maison Francis Kurkdjian",
    //       "whyLink": "https://boycott.thewitness.news/target/maisonfranciskurkdjian",
    //       "productName": "Maison Francis Kurkdjian",
    //       "productDescription": "Maison Francis Kurkdjian",
    //       "categories": [
    //         "FASHION",
    //         "CLOTHING",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://admin.showstudio.com/images/qJ-C79aRXkFj725FPJYdSkL5QgU=/376561/width-640%7Cformat-jpeg/f92ad3f3434f7a20ca931285c2df9906.png",
    //       "name": "Maison Margiela Fragrances",
    //       "whyLink": "https://boycott.thewitness.news/target/maisonmargiela",
    //       "productName": "Maison Margiela Fragrances",
    //       "productDescription": "Maison Margiela Fragrances",
    //       "categories": [
    //         "COSMETICS",
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://i.pinimg.com/originals/5d/fe/db/5dfedbb30f0bc5803283b79a4c9da8fd.jpg",
    //       "name": "Marc Jacobs",
    //       "whyLink": "https://boycott.thewitness.news/target/marcjacobs",
    //       "productName": "Marc Jacobs",
    //       "productDescription": "Marc Jacobs",
    //       "categories": [
    //         "FASHION",
    //         "CLOTHING",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://corporate.marksandspencer.com/sites/marksandspencer/files/styles/desktop/public/marksandspencer/logos/m-s-logo.png",
    //       "name": "Marks and Spencer / M&S",
    //       "whyLink": "https://boycott.thewitness.news/target/marksandspencer",
    //       "productName": "Marks and Spencer / M&S",
    //       "productDescription": "Marks and Spencer / M&S",
    //       "categories": [
    //         "TECHNOLOGY",
    //         "FOOD",
    //         "DRINKS",
    //         "CLOTHING",
    //         "FINANCE",
    //         "INSURANCE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.ihrc.org.uk/briefing-a-brief-chronology-of-the-marks-spencer-israel-relationship/"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0003/5632/brand.gif",
    //       "name": "Maybelline",
    //       "whyLink": "https://boycott.thewitness.news/target/maybelline",
    //       "productName": "Maybelline",
    //       "productDescription": "Maybelline",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://pbs.twimg.com/profile_images/1572161199751454721/P5ubky0o_400x400.jpg",
    //       "name": "MBDA",
    //       "whyLink": "https://boycott.thewitness.news/target/mbda",
    //       "productName": "MBDA",
    //       "productDescription": "MBDA",
    //       "categories": [
    //         "WEAPONS",
    //         "MANUFACTURER"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.israeldefense.co.il/en/node/58894"
    //     },
    //     {
    //       "logo": "https://1000logos.net/wp-content/uploads/2017/03/McDonalds-logo-500x281.png",
    //       "name": "McDonalds",
    //       "whyLink": "https://boycott.thewitness.news/target/mcdonalds",
    //       "productName": "McDonalds",
    //       "productDescription": "McDonalds",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://twitter.com/McDonaldsIL/status/1715047104895230153"
    //     },
    //     {
    //       "logo": "https://www.graduatesfirst.com/wp-content/uploads/2023/07/mercedes-benz-logo-7500641.png",
    //       "name": "Mercedes Benz",
    //       "whyLink": "https://boycott.thewitness.news/target/mercedesbenz",
    //       "productName": "Mercedes Benz",
    //       "productDescription": "Mercedes Benz",
    //       "categories": [
    //         "CAR"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/mercedes-benz-opens-tech-hub-in-tel-aviv-to-secure-lead-in-connected-cars/"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/asset-library/publishingimages/brands/chocolate-confectionery/milkybar-logo-round.png",
    //       "name": "Milkybar",
    //       "whyLink": "https://boycott.thewitness.news/target/milkybar",
    //       "productName": "Milkybar",
    //       "productDescription": "Milkybar",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://ceblog.s3.amazonaws.com/wp-content/uploads/2020/11/13182233/Monday-Logo-1.png",
    //       "name": "Monday.com",
    //       "whyLink": "https://boycott.thewitness.news/target/monday",
    //       "productName": "Monday.com",
    //       "productDescription": "Monday.com",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://investorplace.com/2021/06/mndy-stock-ipo-what-to-know-as-monday-com-starts-trading-today/"
    //     },
    //     {
    //       "logo": "https://s3-symbol-logo.tradingview.com/mondelez--600.png",
    //       "name": "Mondelez",
    //       "whyLink": "https://boycott.thewitness.news/target/mondelez",
    //       "productName": "Mondelez",
    //       "productDescription": "Mondelez",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://ir.mondelezinternational.com/news-releases/news-release-details/mondelez-international-snackfutures-makes-seed-investment"
    //     },
    //     {
    //       "logo": "https://static.vecteezy.com/system/resources/previews/027/076/245/original/monster-energy-logo-transparent-free-png.png",
    //       "name": "Monster Energy",
    //       "whyLink": "https://boycott.thewitness.news/target/monsterenergy",
    //       "productName": "Monster Energy",
    //       "productDescription": "Monster Energy",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
    //     },
    //     {
    //       "logo": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtmGGog03Rp28l-WS8xL5iCUJakSfX14s_qdxOuOkJ&s",
    //       "name": "Moovit",
    //       "whyLink": "https://boycott.thewitness.news/target/moovit",
    //       "productName": "Moovit",
    //       "productDescription": "Moovit",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://twitter.com/UriLevine1"
    //     },
    //     {
    //       "logo": "https://cdn.supadupa.me/shop/13/images/1908639/morrocan-oil-logo-gravity-_grande.png",
    //       "name": "MoroccanOil",
    //       "whyLink": "https://boycott.thewitness.news/target/moroccanoil",
    //       "productName": "MoroccanOil",
    //       "productDescription": "MoroccanOil",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://electronicintifada.net/blogs/sarah-irving/moroccanoil-israeli-hair-products-glamorize-apartheid"
    //     },
    //     {
    //       "logo": "https://cdn.lovesavingsgroup.com/logos/motorola.jpg",
    //       "name": "Motorola",
    //       "whyLink": "https://boycott.thewitness.news/target/motorola",
    //       "productName": "Motorola",
    //       "productDescription": "Motorola",
    //       "categories": [
    //         "MANUFACTURER",
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "http://www.inminds.co.uk/boycott-motorola.php"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0009/3885/brand.gif",
    //       "name": "Mountain Dew",
    //       "whyLink": "https://boycott.thewitness.news/target/mountaindew",
    //       "productName": "Mountain Dew",
    //       "productDescription": "Mountain Dew",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/movenpick-logo-round-2021.png",
    //       "name": "Movenpick",
    //       "whyLink": "https://boycott.thewitness.news/target/movenpick",
    //       "productName": "Movenpick",
    //       "productDescription": "Movenpick",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://notwanepharmacy.store/wp-content/uploads/2020/08/mugler-logo.png",
    //       "name": "Mugler Beauty",
    //       "whyLink": "https://boycott.thewitness.news/target/mugler",
    //       "productName": "Mugler Beauty",
    //       "productDescription": "Mugler Beauty",
    //       "categories": [
    //         "COSMETICS",
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0018/1433/brand.gif",
    //       "name": "Naked Juice",
    //       "whyLink": "https://boycott.thewitness.news/target/nakedjuice",
    //       "productName": "Naked Juice",
    //       "productDescription": "Naked Juice",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/nescafe-logo-square.png",
    //       "name": "Nescafe",
    //       "whyLink": "https://boycott.thewitness.news/target/nescafe",
    //       "productName": "Nescafe",
    //       "productDescription": "Nescafe",
    //       "categories": [
    //         "COFFEE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/nespresso-logo-round-2.png",
    //       "name": "Nespresso",
    //       "whyLink": "https://boycott.thewitness.news/target/nespresso",
    //       "productName": "Nespresso",
    //       "productDescription": "Nespresso",
    //       "categories": [
    //         "COFFEE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/nesquik-logo-round-2021.png",
    //       "name": "Nesquik",
    //       "whyLink": "https://boycott.thewitness.news/target/nesquik",
    //       "productName": "Nesquik",
    //       "productDescription": "Nesquik",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://cdn.worldvectorlogo.com/logos/nestle-5.svg",
    //       "name": "Nestle",
    //       "whyLink": "https://boycott.thewitness.news/target/nestle",
    //       "productName": "Nestle",
    //       "productDescription": "Nestle",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/01-nvidia-logo-vert-500x200-2c50-l@2x.png",
    //       "name": "Nvidia",
    //       "whyLink": "https://boycott.thewitness.news/target/nvidia",
    //       "productName": "Nvidia",
    //       "productDescription": "Nvidia",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.reuters.com/technology/nvidia-build-israeli-supercomputer-ai-demand-soars-2023-05-29"
    //     },
    //     {
    //       "logo": "https://lens-storage.storage.googleapis.com/png/74504afc12b6483d988c46d13fa2f6ca",
    //       "name": "NYX Professional Makeup",
    //       "whyLink": "https://boycott.thewitness.news/target/nyx",
    //       "productName": "NYX Professional Makeup",
    //       "productDescription": "NYX Professional Makeup",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://www.tabletalkmedia.co.uk/wp-content/uploads/2015/11/Oasis-Logo.png",
    //       "name": "Oasis",
    //       "whyLink": "https://boycott.thewitness.news/target/oasis",
    //       "productName": "Oasis",
    //       "productDescription": "Oasis",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
    //     },
    //     {
    //       "logo": "https://1000logos.net/wp-content/uploads/2021/04/Olay-logo.png",
    //       "name": "Olay",
    //       "whyLink": "https://boycott.thewitness.news/target/olay",
    //       "productName": "Olay",
    //       "productDescription": "Olay",
    //       "categories": [
    //         "COSMETICS",
    //         "HEALTHCARE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://1000logos.net/wp-content/uploads/2020/04/Logo-Old-Spice1.jpg",
    //       "name": "Old Spice",
    //       "whyLink": "https://boycott.thewitness.news/target/oldspice",
    //       "productName": "Old Spice",
    //       "productDescription": "Old Spice",
    //       "categories": [
    //         "COSMETICS",
    //         "HEALTHCARE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://www.bookingholdings.com/wp-content/uploads/2018/02/bkng_brands-fullyopen-opentable.svg",
    //       "name": "Opentable",
    //       "whyLink": "https://boycott.thewitness.news/target/opentable",
    //       "productName": "Opentable",
    //       "productDescription": "Opentable",
    //       "categories": [
    //         "TECHNOLOGY",
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.aljazeera.com/news/2022/10/5/is-booking-com-reversal-palestine-corporate-hypocrisy"
    //     },
    //     {
    //       "logo": "https://cdn.freebiesupply.com/logos/large/2x/oracle-1-logo-png-transparent.png",
    //       "name": "Oracle",
    //       "whyLink": "https://boycott.thewitness.news/target/oracle",
    //       "productName": "Oracle",
    //       "productDescription": "Oracle",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.calcalistech.com/ctechnews/article/bj8f1tfbt/"
    //     },
    //     {
    //       "logo": "https://shop.oralb.co.uk/c-images/fb-image.png",
    //       "name": "Oral B",
    //       "whyLink": "https://boycott.thewitness.news/target/oralb",
    //       "productName": "Oral B",
    //       "productDescription": "Oral B",
    //       "categories": [
    //         "HEALTHCARE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://opinionstage-res.cloudinary.com/images/f_auto,q_auto/v1641219211/Case-studies-outbrain-/Case-studies-outbrain-.jpg",
    //       "name": "Outbrain",
    //       "whyLink": "https://boycott.thewitness.news/target/outbrain",
    //       "productName": "Outbrain",
    //       "productDescription": "Outbrain",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://twitter.com/yarongalai"
    //     },
    //     {
    //       "logo": "https://seeklogo.com/images/P/pampers-logo-D613293CC6-seeklogo.com.png",
    //       "name": "Pampers",
    //       "whyLink": "https://boycott.thewitness.news/target/pampers",
    //       "productName": "Pampers",
    //       "productDescription": "Pampers",
    //       "categories": [
    //         "HEALTHCARE",
    //         "HOUSEHOLD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://logowik.com/content/uploads/images/865_pantene.jpg",
    //       "name": "Pantene",
    //       "whyLink": "https://boycott.thewitness.news/target/pantene",
    //       "productName": "Pantene",
    //       "productDescription": "Pantene",
    //       "categories": [
    //         "COSMETICS",
    //         "HEALTHCARE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0021/0128/brand.gif",
    //       "name": "Pepsi",
    //       "whyLink": "https://boycott.thewitness.news/target/pepsi",
    //       "productName": "Pepsi",
    //       "productDescription": "Pepsi",
    //       "categories": [
    //         "DRINKS",
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/perrier-logo-round-green.png",
    //       "name": "Perrier",
    //       "whyLink": "https://boycott.thewitness.news/target/perrier",
    //       "productName": "Perrier",
    //       "productDescription": "Perrier",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://cdn.sanity.io/images/92ui5egz/production/49f021024dbc823ce3fd71bac47d5627f560d333-1080x1080.jpg?w=375&h=375&fit=crop&auto=format",
    //       "name": "Persil",
    //       "whyLink": "https://boycott.thewitness.news/target/persil",
    //       "productName": "Persil",
    //       "productDescription": "Persil",
    //       "categories": [
    //         "HOUSEHOLD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://logowik.com/content/uploads/images/130_pizzahut.jpg",
    //       "name": "Pizza Hut",
    //       "whyLink": "https://boycott.thewitness.news/target/pizzahut",
    //       "productName": "Pizza Hut",
    //       "productDescription": "Pizza Hut",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.calcalistech.com/ctech/articles/0,7340,L-3901254,00.html"
    //     },
    //     {
    //       "logo": "https://restaurantpropertysellers.com/wp-content/uploads/2021/11/popeyes-london-reviews.png",
    //       "name": "Popeyes",
    //       "whyLink": "https://boycott.thewitness.news/target/popeyes",
    //       "productName": "Popeyes",
    //       "productDescription": "Popeyes",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.instagram.com/p/CyORRWHIqeH/"
    //     },
    //     {
    //       "logo": "https://media.home.bargains/brand-images/3/6/9/0/36907459caf36331f385a4772a62ee468006af37.png?x=200",
    //       "name": "Power Action",
    //       "whyLink": "https://boycott.thewitness.news/target/poweraction",
    //       "productName": "Power Action",
    //       "productDescription": "Power Action",
    //       "categories": [
    //         "HOUSEHOLD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://home.bargains/brand/poweraction/power-action"
    //     },
    //     {
    //       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/powerade-logo.png",
    //       "name": "Powerade",
    //       "whyLink": "https://boycott.thewitness.news/target/powerade",
    //       "productName": "Powerade",
    //       "productDescription": "Powerade",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/102010/prada-original.png",
    //       "name": "Prada Beauty",
    //       "whyLink": "https://boycott.thewitness.news/target/prada",
    //       "productName": "Prada Beauty",
    //       "productDescription": "Prada Beauty",
    //       "categories": [
    //         "COSMETICS",
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://www.bookingholdings.com/wp-content/uploads/2018/05/brands-fullyopen-priceline.svg",
    //       "name": "Priceline",
    //       "whyLink": "https://boycott.thewitness.news/target/priceline",
    //       "productName": "Priceline",
    //       "productDescription": "Priceline",
    //       "categories": [
    //         "TECHNOLOGY",
    //         "TRAVEL"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.aljazeera.com/news/2022/10/5/is-booking-com-reversal-palestine-corporate-hypocrisy"
    //     },
    //     {
    //       "logo": "https://logowik.com/content/uploads/images/108_procterandgamble.jpg",
    //       "name": "Procter & Gamble",
    //       "whyLink": "https://boycott.thewitness.news/target/procterandgamble",
    //       "productName": "Procter & Gamble",
    //       "productDescription": "Procter & Gamble",
    //       "categories": [
    //         "HOUSEHOLD",
    //         "COSMETICS",
    //         "FOOD",
    //         "DRINKS",
    //         "HEALTHCARE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://staticg.sportskeeda.com/editor/2023/03/bda84-16779522739911-1920.jpg",
    //       "name": "Puma",
    //       "whyLink": "https://boycott.thewitness.news/target/puma",
    //       "productName": "Puma",
    //       "productDescription": "Puma",
    //       "categories": [
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://thisispuma.com/"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/pure-life-logo-square.png",
    //       "name": "Pure Life",
    //       "whyLink": "https://boycott.thewitness.news/target/purelife",
    //       "productName": "Pure Life",
    //       "productDescription": "Pure Life",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/purina-logo-square-2023.png",
    //       "name": "Purina",
    //       "whyLink": "https://boycott.thewitness.news/target/purina",
    //       "productName": "Purina",
    //       "productDescription": "Purina",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/082012/quakeroats.jpg",
    //       "name": "Quaker Oats",
    //       "whyLink": "https://boycott.thewitness.news/target/quaker",
    //       "productName": "Quaker Oats",
    //       "productDescription": "Quaker Oats",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/qs-logo-round.png",
    //       "name": "Quality Street",
    //       "whyLink": "https://boycott.thewitness.news/target/qualitystreet",
    //       "productName": "Quality Street",
    //       "productDescription": "Quality Street",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0003/0211/brand.gif",
    //       "name": "Ralph Lauren Frangrances",
    //       "whyLink": "https://boycott.thewitness.news/target/ralphlauren",
    //       "productName": "Ralph Lauren Frangrances",
    //       "productDescription": "Ralph Lauren Frangrances",
    //       "categories": [
    //         "COSMETICS",
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://i.redd.it/dbnb0o1q6ci81.png",
    //       "name": "Raytheon",
    //       "whyLink": "https://boycott.thewitness.news/target/raytheon",
    //       "productName": "Raytheon",
    //       "productDescription": "Raytheon",
    //       "categories": [
    //         "WEAPONS",
    //         "MANUFACTURER"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/irondome"
    //     },
    //     {
    //       "logo": "https://www.princessroyaltrainingawards.com/wp-content/uploads/2017/08/Logos-510x288-RBS.jpg",
    //       "name": "RBS",
    //       "whyLink": "https://boycott.thewitness.news/target/rbs",
    //       "productName": "RBS",
    //       "productDescription": "RBS",
    //       "categories": [
    //         "INSURANCE",
    //         "FINANCE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.ethicalconsumer.org/money-finance/israel-deadly-investments"
    //     },
    //     {
    //       "logo": "https://www.bookingholdings.com/wp-content/uploads/2018/02/bkng_brands-fullyopen-rentalcars.com_.svg",
    //       "name": "Rentalcars.com",
    //       "whyLink": "https://boycott.thewitness.news/target/rentalcars",
    //       "productName": "Rentalcars.com",
    //       "productDescription": "Rentalcars.com",
    //       "categories": [
    //         "TECHNOLOGY",
    //         "TRAVEL",
    //         "CAR"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.aljazeera.com/news/2022/10/5/is-booking-com-reversal-palestine-corporate-hypocrisy"
    //     },
    //     {
    //       "logo": "https://cdn.sanity.io/images/92ui5egz/production/d806c6c7edf6271cb15478eae7c34485f4f35d41-1080x1080.jpg?w=375&h=375&fit=crop&auto=format",
    //       "name": "Rexona",
    //       "whyLink": "https://boycott.thewitness.news/target/rexona",
    //       "productName": "Rexona",
    //       "productDescription": "Rexona",
    //       "categories": [
    //         "HEALTHCARE",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://eu-images.contentstack.com/v3/assets/blt781c383a1983f673/bltd2ce17abcde2167e/621c9c6327606b7ce81a315e/riverisland.png",
    //       "name": "River Island",
    //       "whyLink": "https://boycott.thewitness.news/target/riverisland",
    //       "productName": "River Island",
    //       "productDescription": "River Island",
    //       "categories": [
    //         "CLOTHING"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.thejc.com/news/uk/river-island-founder-david-lewis-dies-at-87-1.26225"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0025/2387/brand.gif",
    //       "name": "Rockstar Energy",
    //       "whyLink": "https://boycott.thewitness.news/target/rockstar",
    //       "productName": "Rockstar Energy",
    //       "productDescription": "Rockstar Energy",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/asset-library/publishingimages/brands/bottled-water/spellegrino-logo-round.png",
    //       "name": "S.Pellegrino",
    //       "whyLink": "https://boycott.thewitness.news/target/spellegrino",
    //       "productName": "S.Pellegrino",
    //       "productDescription": "S.Pellegrino",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://pbs.twimg.com/profile_images/1383060096251351050/Ip84a103_400x400.png",
    //       "name": "Sabra",
    //       "whyLink": "https://boycott.thewitness.news/target/sabra",
    //       "productName": "Sabra",
    //       "productDescription": "Sabra",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://www.sadaf.com/cdn/shop/files/sadaf-logo_a5f4d83a-9320-4874-9e71-a4002d5e7f4a_600x.png",
    //       "name": "Sadaf Foods",
    //       "whyLink": "https://boycott.thewitness.news/target/sadaf",
    //       "productName": "Sadaf Foods",
    //       "productDescription": "Sadaf Foods",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://boycottsadaf.com/why-boycott-sadaf/"
    //     },
    //     {
    //       "logo": "https://cdn.icon-icons.com/icons2/2699/PNG/512/sap_logo_icon_170763.png",
    //       "name": "SAP",
    //       "whyLink": "https://boycott.thewitness.news/target/sap",
    //       "productName": "SAP",
    //       "productDescription": "SAP",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/multinational-tech-firms-from-sap-to-intel-to-give-israeli-workers-wartime-grant"
    //     },
    //     {
    //       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/schweppes-logo.png",
    //       "name": "Schweppes",
    //       "whyLink": "https://boycott.thewitness.news/target/schweppes",
    //       "productName": "Schweppes",
    //       "productDescription": "Schweppes",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
    //     },
    //     {
    //       "logo": "https://logosandtypes.com/wp-content/uploads/2020/08/Scotiabank.png",
    //       "name": "Scotia Bank",
    //       "whyLink": "https://boycott.thewitness.news/target/scotiabank",
    //       "productName": "Scotia Bank",
    //       "productDescription": "Scotia Bank",
    //       "categories": [
    //         "FINANCE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://mondoweiss.net/2023/06/canadas-scotiabank-is-funding-israeli-war-crimes/"
    //     },
    //     {
    //       "logo": "https://www.fddinternational.co.uk/wp-content/uploads/2023/03/sephora-logo.jpg",
    //       "name": "Sephora",
    //       "whyLink": "https://boycott.thewitness.news/target/sephora",
    //       "productName": "Sephora",
    //       "productDescription": "Sephora",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://static.wikia.nocookie.net/logopedia/images/2/24/Seven_Seas_%28vitamins%29_1.png",
    //       "name": "Seven Seas",
    //       "whyLink": "https://boycott.thewitness.news/target/sevenseas",
    //       "productName": "Seven Seas",
    //       "productDescription": "Seven Seas",
    //       "categories": [
    //         "HEALTHCARE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/cereals-shredded-wheat-logo.png",
    //       "name": "Shredded Wheat",
    //       "whyLink": "https://boycott.thewitness.news/target/shreddedwheat",
    //       "productName": "Shredded Wheat",
    //       "productDescription": "Shredded Wheat",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/cereals-shreddies-logo.png",
    //       "name": "Shreddies",
    //       "whyLink": "https://boycott.thewitness.news/target/shreddies",
    //       "productName": "Shreddies",
    //       "productDescription": "Shreddies",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://r.lvmh-static.com/uploads/2022/08/stella-logo.png",
    //       "name": "STELLA by Stella McCartney",
    //       "whyLink": "https://boycott.thewitness.news/target/stella",
    //       "productName": "STELLA by Stella McCartney",
    //       "productDescription": "STELLA by Stella McCartney",
    //       "categories": [
    //         "FASHION",
    //         "CLOTHING",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://www.etoro.com/wp-content/uploads/2018/05/eToro-share-img.png",
    //       "name": "eToro",
    //       "whyLink": "https://boycott.thewitness.news/target/etoro",
    //       "productName": "eToro",
    //       "productDescription": "eToro",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://twitter.com/yoniassia"
    //     },
    //     {
    //       "logo": "https://logowik.com/content/uploads/images/skechers5769.logowik.com.webp",
    //       "name": "Skechers",
    //       "whyLink": "https://boycott.thewitness.news/target/skechers",
    //       "productName": "Skechers",
    //       "productDescription": "Skechers",
    //       "categories": [
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.instagram.com/p/CzMMTQgLu9Q/"
    //     },
    //     {
    //       "logo": "https://pbs.twimg.com/profile_images/1619738248468922368/dYCNOxM__400x400.jpg",
    //       "name": "Skims",
    //       "whyLink": "https://boycott.thewitness.news/target/skims",
    //       "productName": "Skims",
    //       "productDescription": "Skims",
    //       "categories": [
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.instagram.com/p/CyRnmHgvhgv/"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/smarties-logo-round-2022.png",
    //       "name": "Smarties",
    //       "whyLink": "https://boycott.thewitness.news/target/smarties",
    //       "productName": "Smarties",
    //       "productDescription": "Smarties",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/092012/soda_stream.png",
    //       "name": "SodaStream",
    //       "whyLink": "https://boycott.thewitness.news/target/sodastream",
    //       "productName": "SodaStream",
    //       "productDescription": "SodaStream",
    //       "categories": [
    //         "DRINKS",
    //         "MANUFACTURER",
    //         "HOUSEHOLD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/%E2%80%9Csodastream-still-subject-boycott%E2%80%9D"
    //     },
    //     {
    //       "logo": "https://www.coca-colacompany.com/content/dam/company/us/en/brands/logos/sprite-logo.png",
    //       "name": "Sprite",
    //       "whyLink": "https://boycott.thewitness.news/target/sprite",
    //       "productName": "Sprite",
    //       "productDescription": "Sprite",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.foa.org.uk/campaign/boycottcocacola"
    //     },
    //     {
    //       "logo": "https://www.lincs-chamber.co.uk/wp-content/uploads/2018/02/Standard-Life-Assurance-logo.png",
    //       "name": "Standard Life",
    //       "whyLink": "https://boycott.thewitness.news/target/standardlife",
    //       "productName": "Standard Life",
    //       "productDescription": "Standard Life",
    //       "categories": [
    //         "FINANCE",
    //         "INSURANCE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.ethicalconsumer.org/money-finance/israel-deadly-investments"
    //     },
    //     {
    //       "logo": "https://www.tailorbrands.com/wp-content/uploads/2020/11/starbucks-logo-2011.jpg",
    //       "name": "Starbucks",
    //       "whyLink": "https://boycott.thewitness.news/target/starbucks",
    //       "productName": "Starbucks",
    //       "productDescription": "Starbucks",
    //       "categories": [
    //         "COFFEE",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://fortune.com/2021/04/07/wiz-howard-schultz-investment-fundraising-cybersecurity-startups-starbucks-ceo/"
    //     },
    //     {
    //       "logo": "https://www.chemist.net/pub/media/brand/sudocrem_bd37.jpg",
    //       "name": "Sudocrem",
    //       "whyLink": "https://boycott.thewitness.news/target/sudocrem",
    //       "productName": "Sudocrem",
    //       "productDescription": "Sudocrem",
    //       "categories": [
    //         "COSMETICS",
    //         "HEALTHCARE",
    //         "PHARMACEUTICALS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.tevauk.com/patients/our-therapy-areas/consumer-healthcare/"
    //     },
    //     {
    //       "logo": "https://cdn.sanity.io/images/92ui5egz/production/e80729857a4e391984df4473831a0cce25271b02-280x280.jpg?w=375&h=375&fit=crop&auto=format",
    //       "name": "Surf",
    //       "whyLink": "https://boycott.thewitness.news/target/surf",
    //       "productName": "Surf",
    //       "productDescription": "Surf",
    //       "categories": [
    //         "HOUSEHOLD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://www.proggio.com/wp-content/uploads/2019/01/feat-Taboola.png",
    //       "name": "Taboola",
    //       "whyLink": "https://boycott.thewitness.news/target/taboola",
    //       "productName": "Taboola",
    //       "productDescription": "Taboola",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://twitter.com/AdamSingolda"
    //     },
    //     {
    //       "logo": null,
    //       "name": "Taco Bell",
    //       "whyLink": "https://boycott.thewitness.news/target/tacobell",
    //       "productName": "Taco Bell",
    //       "productDescription": "Taco Bell",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.calcalistech.com/ctech/articles/0,7340,L-3901254,00.html"
    //     },
    //     {
    //       "logo": "https://i.pinimg.com/originals/50/5f/1d/505f1dc613cff29078ccb445708b7b33.png",
    //       "name": "TAG Heuer",
    //       "whyLink": "https://boycott.thewitness.news/target/tagheuer",
    //       "productName": "TAG Heuer",
    //       "productDescription": "TAG Heuer",
    //       "categories": [
    //         "FASHION",
    //         "LUXURY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://logowik.com/content/uploads/images/tampax3061.jpg",
    //       "name": "Tampax",
    //       "whyLink": "https://boycott.thewitness.news/target/tampax",
    //       "productName": "Tampax",
    //       "productDescription": "Tampax",
    //       "categories": [
    //         "HEALTHCARE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://cdn.worldvectorlogo.com/logos/ted-baker.svg",
    //       "name": "Ted Baker",
    //       "whyLink": "https://boycott.thewitness.news/target/tedbaker",
    //       "productName": "Ted Baker",
    //       "productDescription": "Ted Baker",
    //       "categories": [
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.businesswire.com/news/home/20180713005434/en/Ted-Baker-Signs-New-Licensing-Agreement-with-Delta-Galil"
    //     },
    //     {
    //       "logo": "https://assets.website-files.com/622733c59bf20d8a074764f6/622733c59bf20dbdf4476887_Tesco.png",
    //       "name": "Tesco",
    //       "whyLink": "https://boycott.thewitness.news/target/tesco",
    //       "productName": "Tesco",
    //       "productDescription": "Tesco",
    //       "categories": [
    //         "TECHNOLOGY",
    //         "FOOD",
    //         "DRINKS",
    //         "CLOTHING",
    //         "FINANCE",
    //         "INSURANCE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.businesswire.com/news/home/20211018005203/en/Trigo-Powers-Fully-Autonomous-Tesco-Grocery-Store-in-Central-London"
    //     },
    //     {
    //       "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Teva_Pharmaceuticals_logo.png/2560px-Teva_Pharmaceuticals_logo.png",
    //       "name": "Teva Pharmaceuticals",
    //       "whyLink": "https://boycott.thewitness.news/target/teva",
    //       "productName": "Teva Pharmaceuticals",
    //       "productDescription": "Teva Pharmaceuticals",
    //       "categories": [
    //         "PHARMACEUTICALS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.chemistanddruggist.co.uk/CD017184/Teva-links-to-Israel-prompt-boycott-by-UK-contractors"
    //     },
    //     {
    //       "logo": "https://clearvisioneyecare.ca/wp-content/uploads/2017/03/Tiffany-Co-logo.jpg",
    //       "name": "Tiffany & Co.",
    //       "whyLink": "https://boycott.thewitness.news/target/tiffanyco",
    //       "productName": "Tiffany & Co.",
    //       "productDescription": "Tiffany & Co.",
    //       "categories": [
    //         "FASHION",
    //         "CLOTHING",
    //         "COSMETICS",
    //         "LUXURY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/luxury-goods-magnate-bernard-arnault-invests-in-israeli-cybersecurity-firm-wiz/"
    //     },
    //     {
    //       "logo": "https://fiu-original.b-cdn.net/fontsinuse.com/use-images/168/168197/168197.png?filename=Tim_Hortons_Maple_Leaf.png",
    //       "name": "Tim Hortons",
    //       "whyLink": "https://boycott.thewitness.news/target/timhortons",
    //       "productName": "Tim Hortons",
    //       "productDescription": "Tim Hortons",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.instagram.com/p/CyORRWHIqeH/"
    //     },
    //     {
    //       "logo": "https://media.licdn.com/dms/image/D4E0BAQH9tPiLt38cxA/company-logo_200_200/0/1695305566079?e=2147483647&v=beta&t=er2z4E0XEEsougatDEiiqIlaKhIJ4JnbpT2yTPKZqbM",
    //       "name": "Tom Ford Beauty",
    //       "whyLink": "https://boycott.thewitness.news/target/tomfordbeauty",
    //       "productName": "Tom Ford Beauty",
    //       "productDescription": "Tom Ford Beauty",
    //       "categories": [
    //         "COSMETICS",
    //         "CLOTHING"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.jnf.org/menu-3/speakers-bureau/bio-page?id=830973c9-caae-67a8-a4cf-ff000038378d"
    //     },
    //     {
    //       "logo": null,
    //       "name": "Tresemme",
    //       "whyLink": "https://boycott.thewitness.news/target/tresemme",
    //       "productName": "Tresemme",
    //       "productDescription": "Tresemme",
    //       "categories": [
    //         "HEALTHCARE",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0017/4978/brand.gif",
    //       "name": "Tropicana",
    //       "whyLink": "https://boycott.thewitness.news/target/tropicana",
    //       "productName": "Tropicana",
    //       "productDescription": "Tropicana",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
    //     },
    //     {
    //       "logo": "https://www.egnetwork.eu/wp-content/uploads/2021/03/Logo_Signature_Container_Circle_ENG_RGB.png",
    //       "name": "Unicef",
    //       "whyLink": "https://boycott.thewitness.news/target/unicef",
    //       "productName": "Unicef",
    //       "productDescription": "Unicef",
    //       "categories": [
    //         "CHARITY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Catherine_M._Russell#:~:text=Spouse-,Thomas%20E.%20Donilon,-Children"
    //     },
    //     {
    //       "logo": "https://cdn.sanity.io/images/92ui5egz/production/7c1c60e9afaaaa3cce61e5101717796d21b7f914-1426x1080.svg?rect=0,141,1426,799&w=150&h=84&fit=crop&auto=format",
    //       "name": "Unilever",
    //       "whyLink": "https://boycott.thewitness.news/target/unilever",
    //       "productName": "Unilever",
    //       "productDescription": "Unilever",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/012012/ud.png",
    //       "name": "Urban Decay",
    //       "whyLink": "https://boycott.thewitness.news/target/urbandecay",
    //       "productName": "Urban Decay",
    //       "productDescription": "Urban Decay",
    //       "categories": [
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0002/2916/brand.gif",
    //       "name": "Valentino Beauty",
    //       "whyLink": "https://boycott.thewitness.news/target/valentino",
    //       "productName": "Valentino Beauty",
    //       "productDescription": "Valentino Beauty",
    //       "categories": [
    //         "COSMETICS",
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://m.media-amazon.com/images/S/aplus-media/vc/df9fce60-bbdd-47a9-9971-8f79194b46cc._CR0,0,300,300_PT0_SX300__.jpg",
    //       "name": "Venus",
    //       "whyLink": "https://boycott.thewitness.news/target/venus",
    //       "productName": "Venus",
    //       "productDescription": "Venus",
    //       "categories": [
    //         "HEALTHCARE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://cdn-icons-png.flaticon.com/512/124/124016.png",
    //       "name": "Viber",
    //       "whyLink": "https://boycott.thewitness.news/target/viber",
    //       "productName": "Viber",
    //       "productDescription": "Viber",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://twitter.com/duras"
    //     },
    //     {
    //       "logo": "https://images.ctfassets.net/xuuihvmvy6c9/5R9Uu2Vwa9vtDltACu79Tt/cabf9fbffcc32f7aae7b16088a1030fd/p-1994-XXL_2x.png",
    //       "name": "Vicks",
    //       "whyLink": "https://boycott.thewitness.news/target/vicks",
    //       "productName": "Vicks",
    //       "productDescription": "Vicks",
    //       "categories": [
    //         "HEALTHCARE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.forbes.com/sites/ricardogeromel/2012/05/16/procter-and-gamble-israel-startup/?sh=766ad3d811f5"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/042017/untitled-2_15.png",
    //       "name": "Victorias Secret",
    //       "whyLink": "https://boycott.thewitness.news/target/victoriassecret",
    //       "productName": "Victorias Secret",
    //       "productDescription": "Victorias Secret",
    //       "categories": [
    //         "CLOTHING",
    //         "COSMETICS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.timesofisrael.com/the-relationship-between-epstein-and-jewish-philanthropist-wexner-explained/"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/062010/VR_logo.gif",
    //       "name": "Viktor & Rolf Beauty",
    //       "whyLink": "https://boycott.thewitness.news/target/viktor+rolf",
    //       "productName": "Viktor & Rolf Beauty",
    //       "productDescription": "Viktor & Rolf Beauty",
    //       "categories": [
    //         "COSMETICS",
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     },
    //     {
    //       "logo": "https://www.nestle.com/sites/default/files/styles/thumbnail/public/vittel-logo-round.png",
    //       "name": "Vittel",
    //       "whyLink": "https://boycott.thewitness.news/target/vittel",
    //       "productName": "Vittel",
    //       "productDescription": "Vittel",
    //       "categories": [
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://en.wikipedia.org/wiki/Osem_(company)"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/052018/untitled-4_19.png?Nrpk5Y1UlrEvEEOMK6vQRsPrg_u.VN8O&itok=wHARdQlD",
    //       "name": "Volvo Heavy Machinery",
    //       "whyLink": "https://boycott.thewitness.news/target/volvo",
    //       "productName": "Volvo Heavy Machinery",
    //       "productDescription": "Volvo Heavy Machinery",
    //       "categories": [
    //         "MANUFACTURER"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "http://www.inminds.co.uk/article.php?id=10424"
    //     },
    //     {
    //       "logo": "https://www.walkers.co.uk/assets/img/walkers__logo.png",
    //       "name": "Walker's",
    //       "whyLink": "https://boycott.thewitness.news/target/walkers",
    //       "productName": "Walker's",
    //       "productDescription": "Walker's",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.bloomberg.com/view/articles/2018-08-22/pepsico-s-sodastream-purchase-is-sweet-news-for-israelis?leadSource=uverify%20wall"
    //     },
    //     {
    //       "logo": "https://cdn.sanity.io/images/92ui5egz/production/88537a9efbbd962b3ff2f063af7b7b6985c146bc-1080x1080.png?w=375&h=375&fit=crop&auto=format",
    //       "name": "Walls Ice Creams",
    //       "whyLink": "https://boycott.thewitness.news/target/walls",
    //       "productName": "Walls Ice Creams",
    //       "productDescription": "Walls Ice Creams",
    //       "categories": [
    //         "FOOD"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.unilever.com/news/press-and-media/press-releases/2022/unilever-reaches-new-business-arrangement-for-ben-jerrys-in-israel/"
    //     },
    //     {
    //       "logo": "https://media.designrush.com/inspiration_images/345908/conversions/walmart_1-preview.jpg",
    //       "name": "Walmart",
    //       "whyLink": "https://boycott.thewitness.news/target/walmart",
    //       "productName": "Walmart",
    //       "productDescription": "Walmart",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS",
    //         "HEALTHCARE",
    //         "COSMETICS",
    //         "SUPERMARKET"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.jpost.com/business-and-innovation/article-770698"
    //     },
    //     {
    //       "logo": "https://9to5google.com/2020/06/29/waze-logo-2020-brand-refresh/waze-logo-2020-1/",
    //       "name": "Waze",
    //       "whyLink": "https://boycott.thewitness.news/target/waze",
    //       "productName": "Waze",
    //       "productDescription": "Waze",
    //       "categories": [
    //         "TECHNOLOGY",
    //         "TRAVEL"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://twitter.com/UriLevine1"
    //     },
    //     {
    //       "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Wells_Fargo_Logo_%282020%29.svg/800px-Wells_Fargo_Logo_%282020%29.svg.png",
    //       "name": "Wells Fargo",
    //       "whyLink": "https://boycott.thewitness.news/target/wellsfargo",
    //       "productName": "Wells Fargo",
    //       "productDescription": "Wells Fargo",
    //       "categories": [
    //         "FINANCE"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://breachmedia.ca/revealed-bmo-bankrolled-israeli-weapons-maker-with-a-90m-loan/"
    //     },
    //     {
    //       "logo": "https://cdn-icons-png.flaticon.com/512/5968/5968762.png",
    //       "name": "Wix",
    //       "whyLink": "https://boycott.thewitness.news/target/wix",
    //       "productName": "Wix",
    //       "productDescription": "Wix",
    //       "categories": [
    //         "TECHNOLOGY"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://twitter.com/avishai_ab"
    //     },
    //     {
    //       "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Yum%21_Brands_logo.svg/1200px-Yum%21_Brands_logo.svg.png",
    //       "name": "Yum Foods",
    //       "whyLink": "https://boycott.thewitness.news/target/yumfoods",
    //       "productName": "Yum Foods",
    //       "productDescription": "Yum Foods",
    //       "categories": [
    //         "FOOD",
    //         "DRINKS"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://www.calcalistech.com/ctech/articles/0,7340,L-3901254,00.html"
    //     },
    //     {
    //       "logo": "https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/102014/logo_cassandre-ysl.png",
    //       "name": "Yves Saint Laurent Beauty / YSL Beauty",
    //       "whyLink": "https://boycott.thewitness.news/target/ysl",
    //       "productName": "Yves Saint Laurent Beauty / YSL Beauty",
    //       "productDescription": "Yves Saint Laurent Beauty / YSL Beauty",
    //       "categories": [
    //         "COSMETICS",
    //         "CLOTHING",
    //         "FASHION"
    //       ],
    //       "explanationText": null,
    //       "alternatives": null,
    //       "proofLink": "https://bdsmovement.net/news/l%E2%80%99oreal-makeup-israeli-apartheid"
    //     }
    //   ])