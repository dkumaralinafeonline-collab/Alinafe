// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

// // 1️⃣ Connect to MongoDB
// await mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// console.log("MongoDB Connected");

// // 2️⃣ Define Product Schema (simplified)
// const productSchema = new mongoose.Schema({}, { strict: false });
// const Product = mongoose.model("Product", productSchema);

// // 3️⃣ Normalize products
// const normalizeProducts = async () => {
//   const products = await Product.find({});

//   for (const product of products) {
//     const updates = {};

//     // Normalize price
//     if (product.price) {
//       if (typeof product.price === "string") {
//         updates.price = Number(product.price.replace("₹", "").replace(/,/g, ""));
//       } else {
//         updates.price = Number(product.price);
//       }
//     } else {
//       updates.price = 0; // default
//     }

//     // Ensure oldPrice exists
//     if (!product.oldPrice) {
//       updates.oldPrice = null;
//     } else if (typeof product.oldPrice === "string") {
//       updates.oldPrice = Number(product.oldPrice.replace("₹", "").replace(/,/g, ""));
//     }

//     // Ensure images array
//     if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
//       updates.images = ["https://via.placeholder.com/600"];
//     }

//     // Ensure category
//     if (!product.category) {
//       updates.category = "Footwear";
//     }

//     await Product.updateOne({ _id: product._id }, { $set: updates });
//     console.log(`Updated: ${product.name}`);
//   }

//   console.log("All products normalized!");
// };

// normalizeProducts()
//   .then(() => mongoose.disconnect())
//   .catch((err) => {
//     console.error(err);
//     mongoose.disconnect();
//   });



// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

// // 1️⃣ Connect to MongoDB
// await mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// console.log("✅ MongoDB Connected");

// // 2️⃣ Define Product Schema
// const productSchema = new mongoose.Schema({}, { strict: false });
// const Product = mongoose.model("Product", productSchema);

// // 3️⃣ Update all products with a random oldPrice > price
// const updateOldPrices = async () => {
//   try {
//     const products = await Product.find({});

//     for (const product of products) {
//       const price = Number(product.price?.$numberInt || product.price || 0);

//       if (!price || price <= 0) continue;

//       // Generate a random old price: between price + 200 and price + 1500
//       let oldPrice = Math.floor(price + Math.random() * 1300 + 200);

//       // Ensure it's a 4-digit number
//       if (oldPrice < 1000) oldPrice = 1000 + Math.floor(Math.random() * 9000);

//       // Update the product
//       await Product.updateOne(
//         { _id: product._id },
//         { $set: { oldPrice } }
//       );

//       console.log(`✅ Updated product ${product.name} → oldPrice: ₹${oldPrice}`);
//     }

//     console.log("🎉 All old prices updated successfully!");
//   } catch (err) {
//     console.error("❌ Error updating old prices:", err);
//   } finally {
//     mongoose.connection.close();
//   }
// };

// await updateOldPrices();






// // del.js
// import mongoose from "mongoose";

// // 1️⃣ MongoDB URI
// const MONGO_URI = "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/ecommerceDB?retryWrites=true&w=majority";

// // 2️⃣ Connect to MongoDB
// await mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// console.log("✅ MongoDB Connected");

// // 3️⃣ Flexible Product model
// const productSchema = new mongoose.Schema({}, { strict: false });
// const Product = mongoose.model("Product", productSchema);

// // 4️⃣ Update all products in category 'Footwear'
// const result = await Product.updateMany(
//   { category: "Footwear" },
//   {
//     $set: {
//       gender: "Men", // You can also randomize "Men", "Women", "Kid"
//       colors: ["black", "white", "navy"], // Example colors
//     },
//   }
// );

// console.log(`✅ Updated ${result.modifiedCount} products in 'Footwear' category`);

// // 5️⃣ Close the connection
// await mongoose.connection.close();
// console.log("✅ MongoDB connection closed");




// // updateFootwear.js
// import mongoose from "mongoose";

// // 1️⃣ MongoDB URI
// const MONGO_URI = "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/ecommerceDB?retryWrites=true&w=majority";

// // 2️⃣ Connect to MongoDB
// await mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// console.log("✅ MongoDB Connected");

// // 3️⃣ Flexible Product model
// const productSchema = new mongoose.Schema({}, { strict: false });
// const Product = mongoose.model("Product", productSchema);

// // 4️⃣ Helper function to generate random sizes and stock
// const generateSizes = () => {
//   const sizes = [];
//   for (let s = 6; s <= 12; s++) {
//     sizes.push({ size: s, stock: Math.floor(Math.random() * 20) + 5 });
//   }
//   return sizes;
// };

// // 5️⃣ Helper function to assign random gender
// const genders = ["Men", "Women", "Kid"];
// const getRandomGender = () => genders[Math.floor(Math.random() * genders.length)];

// // 6️⃣ Update all Footwear products
// const result = await Product.updateMany(
//   { category: "Footwear" },
//   {
//     $set: {
//       subCategory: "Running Shoes", // You can randomize later
//       sizes: generateSizes(),
//       colors: ["black", "white", "navy"], // Add more colors if needed
//       gender: getRandomGender(),
//       material: "Leather / Mesh",
//       features: ["Cushioned sole", "Breathable", "Lightweight"],
//       tags: ["running", "sport", "comfort", "outdoor"],
//       sku: "AUTO-GENERATED",
//       status: "In Stock",
//       discount: { percentage: 30, startDate: "2025-10-01", endDate: "2025-10-10" },
//       reviews: [
//         { user: "John", comment: "Very comfortable!", rating: 5 },
//         { user: "Alice", comment: "Looks great!", rating: 4 }
//       ]
//     }
//   }
// );

// console.log(`✅ Updated ${result.modifiedCount} products in 'Footwear' category`);

// // 7️⃣ Close connection
// await mongoose.connection.close();
// console.log("✅ MongoDB connection closed");





// import mongoose from "mongoose";

// // MongoDB URI
// const MONGO_URI = "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/ecommerceDB?retryWrites=true&w=majority";

// // Conversion rate from INR to MWK
// const conversionRate = 18.43; // 1 INR = 18.43 MWK

// // Connect to MongoDB
// await mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// console.log("✅ MongoDB Connected");

// // Define the product schema (simplified)
// const productSchema = new mongoose.Schema({}, { strict: false });
// const Product = mongoose.model("products", productSchema); // Replace 'products' with your collection name

// // Update all prices
// const products = await Product.find({});
// for (let product of products) {
//   const newPrice = Math.round(product.price * conversionRate);
//   const newOldPrice = product.oldPrice ? Math.round(product.oldPrice * conversionRate) : undefined;

//   product.price = newPrice;
//   if (newOldPrice) product.oldPrice = newOldPrice;

//   await product.save();
//   console.log(`Updated ${product.name}: Price -> ${newPrice}, OldPrice -> ${newOldPrice}`);
// }

// console.log("✅ All prices updated to Malawian Kwacha (MWK)");
// process.exit(0);


// // updateWomenWear.js
// import mongoose from "mongoose";

// // 1️⃣ MongoDB URI
// const MONGO_URI =
//   "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/ecommerceDB?retryWrites=true&w=majority";

// // 2️⃣ Connect to MongoDB
// await mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// console.log("✅ MongoDB Connected");

// // 3️⃣ Flexible Product Model (no strict schema)
// const productSchema = new mongoose.Schema({}, { strict: false });
// const Product = mongoose.model("Product", productSchema);

// // 4️⃣ Helper functions for realism
// const fabrics = ["Cotton", "Silk", "Rayon", "Georgette", "Chiffon", "Crepe"];
// const colors = ["Red", "Blue", "Black", "White", "Pink", "Green", "Maroon", "Beige"];
// const styles = ["Anarkali", "Straight Cut", "A-Line", "Flared", "Printed", "Embroidered"];
// const occasions = ["Casual", "Party", "Festive", "Wedding", "Office Wear"];
// const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
// const seasons = ["Summer", "Winter", "All Season", "Monsoon", "Spring"];

// const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const randomPrice = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// // 5️⃣ Add new fashion attributes
// const result = await Product.updateMany(
//   { category: "Women Wear" },
//   [
//     {
//       $set: {
//         fabric: {
//           $arrayElemAt: [fabrics, { $floor: { $multiply: [Math.random(), fabrics.length] } }],
//         },
//         color: {
//           $arrayElemAt: [colors, { $floor: { $multiply: [Math.random(), colors.length] } }],
//         },
//         style: {
//           $arrayElemAt: [styles, { $floor: { $multiply: [Math.random(), styles.length] } }],
//         },
//         occasion: {
//           $arrayElemAt: [occasions, { $floor: { $multiply: [Math.random(), occasions.length] } }],
//         },
//         availableSizes: sizes,
//         season: {
//           $arrayElemAt: [seasons, { $floor: { $multiply: [Math.random(), seasons.length] } }],
//         },
//         careInstructions: [
//           "Machine wash cold with like colors",
//           "Do not bleach",
//           "Tumble dry low",
//           "Cool iron if needed",
//         ],
//         fit: { $cond: [{ $lt: [Math.random(), 0.5] }, "Regular Fit", "Slim Fit"] },
//         length: { $cond: [{ $lt: [Math.random(), 0.5] }, "Knee Length", "Full Length"] },
//         countryOfOrigin: "India",
//         warranty: "No Warranty (Apparel Product)",
//         tags: ["fashion", "women", "style", "trend", "comfortable"],
//         discount: {
//           percentage: Math.floor(Math.random() * 25) + 5,
//           startDate: new Date("2025-10-01"),
//           endDate: new Date("2025-10-31"),
//         },
//         highlights: [
//           "Soft breathable fabric",
//           "Elegant design suitable for all occasions",
//           "Comfortable for long wear",
//           "Premium stitching quality",
//         ],
//         reviews: [
//           { user: "Neha", comment: "Loved the fabric and fit!", rating: 5 },
//           { user: "Aarohi", comment: "Color is same as shown in image!", rating: 4 },
//           { user: "Kavita", comment: "Very comfortable and elegant.", rating: 5 },
//         ],
//         sku: {
//           $concat: [
//             "WMN-",
//             { $toString: { $floor: { $multiply: [Math.random(), 99999] } } },
//           ],
//         },
//         status: "In Stock",
//       },
//     },
//   ]
// );

// console.log(`✅ Updated ${result.modifiedCount} products in 'Women Wear' category`);

// // 6️⃣ Close connection
// await mongoose.connection.close();
// console.log("🔌 MongoDB connection closed");

// import mongoose from "mongoose";

// // 1️⃣ MongoDB Atlas Connection URI
// const MONGO_URI =
//   "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/ecommerceDB?retryWrites=true&w=majority";

// // 2️⃣ Connect to MongoDB
// await mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// console.log("✅ MongoDB Connected Successfully!");

// // 3️⃣ Flexible Schema
// const productSchema = new mongoose.Schema({}, { strict: false });
// const Product = mongoose.model("Product", productSchema);

// // 4️⃣ Target Category
// const category = "Beauty & Skincare";

// // 5️⃣ Beauty & Skincare Image Pool
// const randomImages = [
//   "https://assets.myntassets.com/dpr_1.5,q_30,w_400,c_limit,fl_progressive/assets/images/11131116/2024/3/11/0c431f0b-7b6c-43c9-8297-bc91c210189b1710155800005-Lakme-Forever-Matte-Liquid-Lip-Colour-56-ml---Nude-Dream-892-1.jpg",
//   "https://images.unsplash.com/photo-1598460880248-71ec6d2d582b?auto=format&fit=crop&q=80&w=707",
//   "https://images.unsplash.com/photo-1600852306771-c963331af110?auto=format&fit=crop&q=80&w=735",
//   "https://images.unsplash.com/photo-1618330834871-dd22c2c226ca?auto=format&fit=crop&q=80&w=687",
//   "https://media.thebodyshop.in/media/catalog/product/1/0/1033429_tea_tree_skin_clearing_facial_wash_ax_250ml_bronze_nw_inaevps022_-_copy_bfabtvgyy1vq3fob.jpg?format=auto",
//   "https://media.thebodyshop.in/media/catalog/product/m/a/marigold_body_lotion_200ml_-_copy_xdviobnf3j8tk4jl.jpg?format=auto",
//   "https://media.thebodyshop.in/media/catalog/product/q/r/qr-24381043-hibiscus_hand_wash_275ml_-_copy_ra0tipsbt7gsinhx.jpg?format=auto",
//   "https://sdcdn.io/cl/cl_sku_KWW301_2500x2500_0.png?height=700px&width=700px",
//   "https://m.media-amazon.com/images/I/51EFM8yM+ZL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/51uZGy0RM9L._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/51O+J5jnXcL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/51ixwpTYK7L._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/71M33O0-KyL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/51OpBDs+GhL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/618jobvtmgL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/51AmjNNFiyL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/71nOTD06ogL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/711wL0RX9OL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/617TtFejmwL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/61Vp0-XHx2L._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/61wnTty2EBL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/41O9eTbPAgL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/615HOg8nZiL._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/61OFfAjyX2L._AC_UL480_FMwebp_QL65_.jpg",
//   "https://m.media-amazon.com/images/I/51SZjDkxtZL._AC_UL480_FMwebp_QL65_.jpg"
// ];

// // 6️⃣ Helper — Pick a random image
// const getRandomImage = () =>
//   randomImages[Math.floor(Math.random() * randomImages.length)];

// // 7️⃣ Fetch All “Beauty & Skincare” Products
// const products = await Product.find({ category });
// console.log(`📦 Found ${products.length} products in category: ${category}`);

// if (products.length === 0) {
//   console.log("⚠️ No products found in this category!");
//   process.exit(0);
// }

// // 8️⃣ Prepare Bulk Update Operations
// const bulkOps = products.map((product) => {
//   const updatedImages = [...(product.images || [])];
//   updatedImages[0] = getRandomImage(); // random image for index [0]

//   return {
//     updateOne: {
//       filter: { _id: product._id },
//       update: { $set: { images: updatedImages } },
//     },
//   };
// });

// // 9️⃣ Execute All Updates at Once
// const result = await Product.bulkWrite(bulkOps);
// console.log(`✅ Successfully updated ${result.modifiedCount} “${category}” products!`);

// // 🔟 Close Connection
// await mongoose.connection.close();
// console.log(`🎉 Done! All ${category} products now have random first images.`);



// // import mongoose from "mongoose";

// // // 1️⃣ MongoDB Atlas Connection URI
// // const MONGO_URI =
// //   "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/ecommerceDB?retryWrites=true&w=majority";

// // // 2️⃣ Define Product Schema (basic)
// // const productSchema = new mongoose.Schema({
// //   id: Number,
// //   name: String,
// //   description: String,
// //   category: String,
// //   price: Number,
// //   brand: String,
// //   rating: Number,
// //   stock: Number,
// //   images: [String],
// //   oldPrice: Number,
// //   highlights: [String],
// //   features: [String],
// //   specs: Object,
// //   warranty: String,
// //   sku: String,
// //   tags: [String],
// //   discount: {
// //     percentage: Number,
// //     startDate: Date,
// //     endDate: Date,
// //   },
// //   status: String,
// //   reviews: [
// //     {
// //       user: String,
// //       comment: String,
// //       rating: Number,
// //     },
// //   ],
// // });

// // const Product = mongoose.model("Product", productSchema);

// // // 3️⃣ Product Data (20 Beauty & Skincare products)
// // const products = [
// //   {
// //     id: 1,
// //     name: "L’Oréal Revitalift Face Serum",
// //     description: "Hydrating anti-aging serum for glowing and firm skin.",
// //     category: "Beauty & Skincare",
// //     price: 18500,
// //     brand: "L’Oréal Paris",
// //     rating: 4.7,
// //     stock: 40,
// //     images: [
// //       "https://source.unsplash.com/600x600/?serum,beauty,skincare,1",
// //       "https://source.unsplash.com/601x601/?serum,face,beauty,1",
// //       "https://source.unsplash.com/602x602/?serum,cosmetics,1",
// //     ],
// //     oldPrice: 21000,
// //     highlights: ["Firms skin", "Deep hydration"],
// //     features: ["Pro-Retinol formula", "Lightweight texture", "Dermatologist tested"],
// //     specs: { volume: "30ml", skinType: "All", usage: "Morning & Night" },
// //     warranty: "6 Months Satisfaction Guarantee",
// //     sku: "BEAU-60001",
// //     tags: ["serum", "anti-aging"],
// //     discount: {
// //       percentage: 12,
// //       startDate: new Date("2025-10-01"),
// //       endDate: new Date("2025-12-01"),
// //     },
// //     status: "In Stock",
// //     reviews: [
// //       { user: "Ananya", comment: "Skin feels smoother!", rating: 5 },
// //       { user: "Priya", comment: "Very refreshing.", rating: 4 },
// //     ],
// //   },
// //   {
// //     id: 2,
// //     name: "Maybelline SuperStay Matte Lipstick",
// //     description: "Long-lasting matte lipstick with vibrant color and smooth texture.",
// //     category: "Beauty & Skincare",
// //     price: 7500,
// //     brand: "Maybelline",
// //     rating: 4.5,
// //     stock: 80,
// //     images: [
// //       "https://source.unsplash.com/600x600/?lipstick,makeup,beauty,2",
// //       "https://source.unsplash.com/601x601/?lipstick,cosmetics,2",
// //       "https://source.unsplash.com/602x602/?lipstick,fashion,2",
// //     ],
// //     oldPrice: 8200,
// //     highlights: ["24H stay", "No smudge finish"],
// //     features: ["Waterproof", "Transfer-proof", "Matte effect"],
// //     specs: { shade: "Crimson Red", finish: "Matte" },
// //     warranty: "12 Months",
// //     sku: "BEAU-60002",
// //     tags: ["lipstick", "makeup"],
// //     discount: {
// //       percentage: 8,
// //       startDate: new Date("2025-10-01"),
// //       endDate: new Date("2025-12-01"),
// //     },
// //     status: "In Stock",
// //     reviews: [
// //       { user: "Kavya", comment: "Love the color!", rating: 5 },
// //       { user: "Ritika", comment: "Lasts all day!", rating: 4 },
// //     ],
// //   },
// //   {
// //     id: 3,
// //     name: "Nivea Soft Moisturizing Cream",
// //     description: "Light moisturizing cream for face and body with Vitamin E.",
// //     category: "Beauty & Skincare",
// //     price: 5800,
// //     brand: "Nivea",
// //     rating: 4.6,
// //     stock: 100,
// //     images: [
// //       "https://source.unsplash.com/600x600/?moisturizer,cream,beauty,3",
// //       "https://source.unsplash.com/601x601/?cream,skin,beauty,3",
// //       "https://source.unsplash.com/602x602/?nivea,skincare,3",
// //     ],
// //     oldPrice: 6400,
// //     highlights: ["Hydrates deeply", "Soft, smooth skin"],
// //     features: ["Vitamin E enriched", "Fast absorption", "Non-greasy"],
// //     specs: { volume: "100ml", skinType: "Normal to Dry" },
// //     warranty: "6 Months",
// //     sku: "BEAU-60003",
// //     tags: ["moisturizer", "cream"],
// //     discount: {
// //       percentage: 10,
// //       startDate: new Date("2025-10-01"),
// //       endDate: new Date("2025-12-01"),
// //     },
// //     status: "In Stock",
// //     reviews: [
// //       { user: "Simran", comment: "So soft and fresh!", rating: 5 },
// //       { user: "Kiran", comment: "Perfect for dry skin.", rating: 4 },
// //     ],
// //   },
// //   {
// //     id: 4,
// //     name: "Dove Intense Repair Shampoo",
// //     description: "Strengthens and nourishes damaged hair from root to tip.",
// //     category: "Beauty & Skincare",
// //     price: 9200,
// //     brand: "Dove",
// //     rating: 4.4,
// //     stock: 70,
// //     images: [
// //       "https://source.unsplash.com/600x600/?shampoo,haircare,beauty,4",
// //       "https://source.unsplash.com/601x601/?hair,beauty,4",
// //       "https://source.unsplash.com/602x602/?dove,cosmetics,4",
// //     ],
// //     oldPrice: 9900,
// //     highlights: ["Reduces breakage", "Adds shine"],
// //     features: ["Keratin actives", "Gentle cleansing", "Moisture balance"],
// //     specs: { volume: "180ml", hairType: "Damaged" },
// //     warranty: "6 Months",
// //     sku: "BEAU-60004",
// //     tags: ["shampoo", "haircare"],
// //     discount: {
// //       percentage: 7,
// //       startDate: new Date("2025-10-01"),
// //       endDate: new Date("2025-12-01"),
// //     },
// //     status: "In Stock",
// //     reviews: [
// //       { user: "Reena", comment: "My hair feels silky!", rating: 5 },
// //       { user: "Meena", comment: "Good but a bit pricey.", rating: 4 },
// //     ],
// //   },
// //   {
// //     id: 5,
// //     name: "The Body Shop British Rose Body Lotion",
// //     description: "Luxurious floral body lotion infused with real rose essence.",
// //     category: "Beauty & Skincare",
// //     price: 13200,
// //     brand: "The Body Shop",
// //     rating: 4.8,
// //     stock: 55,
// //     images: [
// //       "https://source.unsplash.com/600x600/?lotion,beauty,rose,5",
// //       "https://source.unsplash.com/601x601/?bodylotion,skincare,5",
// //       "https://source.unsplash.com/602x602/?rose,beauty,5",
// //     ],
// //     oldPrice: 14500,
// //     highlights: ["Rose scent", "Smooth skin"],
// //     features: ["Non-sticky", "Floral fragrance", "Vegan formula"],
// //     specs: { volume: "200ml", skinType: "All" },
// //     warranty: "1 Year",
// //     sku: "BEAU-60005",
// //     tags: ["body lotion", "floral"],
// //     discount: {
// //       percentage: 9,
// //       startDate: new Date("2025-10-01"),
// //       endDate: new Date("2025-12-01"),
// //     },
// //     status: "In Stock",
// //     reviews: [
// //       { user: "Nita", comment: "Smells heavenly!", rating: 5 },
// //       { user: "Mona", comment: "Softens skin quickly.", rating: 4 },
// //     ],
// //   },
// //   // 👇 15 more automatically generated beauty items
// //   ...Array.from({ length: 15 }, (_, i) => ({
// //     id: 6 + i,
// //     name: `Beauty Product ${i + 6}`,
// //     description: "Premium beauty and skincare essential for daily routine.",
// //     category: "Beauty & Skincare",
// //     price: 6000 + i * 800,
// //     brand: ["L’Oréal", "Maybelline", "Nivea", "Dove", "The Body Shop", "Neutrogena", "Olay"][
// //       i % 7
// //     ],
// //     rating: (4 + (i % 5) * 0.1).toFixed(1),
// //     stock: 40 + i * 3,
// //     images: [
// //       `https://source.unsplash.com/600x600/?beauty,skincare,${i + 6}`,
// //       `https://source.unsplash.com/601x601/?makeup,cosmetics,${i + 6}`,
// //       `https://source.unsplash.com/602x602/?selfcare,beauty,${i + 6}`,
// //     ],
// //     oldPrice: 6500 + i * 850,
// //     highlights: ["Natural finish", "Smooth texture"],
// //     features: ["Dermatologist tested", "Gentle formula", "Long-lasting fragrance"],
// //     specs: { volume: `${50 + i * 5}ml`, skinType: "All" },
// //     warranty: "6 Months",
// //     sku: `BEAU-600${i + 6}`,
// //     tags: ["beauty", "skincare"],
// //     discount: {
// //       percentage: 10,
// //       startDate: new Date("2025-10-01"),
// //       endDate: new Date("2025-12-01"),
// //     },
// //     status: "In Stock",
// //     reviews: [
// //       { user: "User" + (i + 1), comment: "Great quality!", rating: 5 },
// //       { user: "Reviewer" + (i + 1), comment: "Would buy again.", rating: 4 },
// //     ],
// //   })),
// // ];

// // // 4️⃣ Connect and Insert
// // (async () => {
// //   try {
// //     await mongoose.connect(MONGO_URI, {
// //       useNewUrlParser: true,
// //       useUnifiedTopology: true,
// //     });
// //     console.log("✅ MongoDB Connected Successfully!");

// //     await Product.insertMany(products);
// //     console.log("🌸 Inserted 20 Beauty & Skincare Products Successfully!");

// //     await mongoose.disconnect();
// //     console.log("🔌 Disconnected from MongoDB");
// //   } catch (err) {
// //     console.error("❌ Error inserting products:", err);
// //   }
// // })();

// import mongoose from "mongoose";

// // 🔗 MongoDB Connection URI
// const MONGO_URI =
//   "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/ecommerceDB?retryWrites=true&w=majority";

// // 🧾 Flexible Schema (allows any structure)
// const productSchema = new mongoose.Schema({}, { strict: false });
// const Product = mongoose.model("Product", productSchema, "products");

// // 💾 Dummy Electronics Ads
// const electronicsAds = [
//   {
//     ownerUid: "SgSR3yFhLMVKzOMoEOsbPu4r2RO2",
//     title: "Sony Bravia 55 Inch 4K Smart TV - Excellent Condition",
//     description: `Enjoy stunning 4K visuals with the Sony Bravia 55” Smart TV. 
// Crystal-clear picture quality, HDR10, and built-in streaming apps for an immersive experience.
// ✨ Key Features:
// - Display: 55” 4K Ultra HD HDR Smart LED
// - Connectivity: Wi-Fi, HDMI, USB
// - Audio: Dolby Digital surround sound
// - Condition: Excellent with minimal use
// 📦 Included:
// TV Unit, Remote Control, Power Cable`,
//     category: "Electronics",
//     subcategory: "TVs",
//     condition: "Used",
//     price: 380000,
//     negotiable: true,
//     currency: "MK",
//     images: ["/uploads/tv1.png", "/uploads/tv2.png", "/uploads/tv3.png"],
//     city: "Lilongwe",
//     location: "City Center",
//     deliveryAvailable: true,
//     views: 0,
//     favouritesCount: 0,
//     status: "Active",
//     featured: false,
//     reported: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     ownerUid: "SgSR3yFhLMVKzOMoEOsbPu4r2RO2",
//     title: "Dell XPS 13 Laptop - Core i7, 16GB RAM, 512GB SSD",
//     description: `Powerful and compact laptop for professionals and creators. 
// Smooth multitasking, long battery life, and a premium aluminum build.
// ✨ Key Features:
// - Processor: Intel Core i7 12th Gen
// - RAM: 16GB | Storage: 512GB SSD
// - Display: 13.4” InfinityEdge Touchscreen
// - Battery: Up to 12 hours
// 📦 Included:
// Laptop, Charger, Original Box`,
//     category: "Electronics",
//     subcategory: "Laptops",
//     condition: "Like New",
//     price: 720000,
//     negotiable: true,
//     currency: "MK",
//     images: ["/uploads/dellxps1.png", "/uploads/dellxps2.png"],
//     city: "Blantyre",
//     location: "Limbe Market",
//     deliveryAvailable: false,
//     views: 0,
//     favouritesCount: 0,
//     status: "Active",
//     featured: true,
//     reported: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     ownerUid: "SgSR3yFhLMVKzOMoEOsbPu4r2RO2",
//     title: "Canon EOS 90D DSLR Camera - 32.5MP | 4K Video",
//     description: `Perfect camera for photographers and videographers.
// Fast autofocus, crisp detail, and professional-grade 4K recording.
// ✨ Key Features:
// - 32.5MP CMOS Sensor
// - 4K UHD 30p video recording
// - Wi-Fi & Bluetooth connectivity
// - Dual Pixel Autofocus
// 📦 Included:
// Camera Body, Battery, Charger, 32GB SD Card`,
//     category: "Electronics",
//     subcategory: "Cameras",
//     condition: "Used",
//     price: 550000,
//     negotiable: false,
//     currency: "MK",
//     images: ["/uploads/canon90d1.png", "/uploads/canon90d2.png"],
//     city: "Mzuzu",
//     location: "Mchengautuba",
//     deliveryAvailable: true,
//     views: 0,
//     favouritesCount: 0,
//     status: "Active",
//     featured: false,
//     reported: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     ownerUid: "SgSR3yFhLMVKzOMoEOsbPu4r2RO2",
//     title: "JBL PartyBox 310 Bluetooth Speaker - Loud & Powerful",
//     description: `Take the party anywhere with JBL PartyBox 310.
// Massive bass, RGB lights, and 18 hours of playtime.
// ✨ Key Features:
// - 240W RMS Power Output
// - Dynamic light show
// - IPX4 Splashproof
// - Bluetooth & AUX support
// 📦 Included:
// Speaker, Charging Cable`,
//     category: "Electronics",
//     subcategory: "Speakers",
//     condition: "Excellent",
//     price: 260000,
//     negotiable: true,
//     currency: "MK",
//     images: ["/uploads/jbl1.png", "/uploads/jbl2.png"],
//     city: "Zomba",
//     location: "Zomba Central",
//     deliveryAvailable: true,
//     views: 0,
//     favouritesCount: 0,
//     status: "Active",
//     featured: false,
//     reported: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   {
//     ownerUid: "SgSR3yFhLMVKzOMoEOsbPu4r2RO2",
//     title: "Apple Watch Series 8 - 45mm GPS | Midnight Black",
//     description: `Stay connected, fit, and healthy with the Apple Watch Series 8.
// Advanced health tracking and stunning always-on Retina display.
// ✨ Key Features:
// - GPS, Heart Rate, and ECG monitoring
// - Crash Detection & Sleep Tracking
// - Water resistant up to 50m
// - WatchOS 10
// 📦 Included:
// Watch, Magnetic Charger, Original Box`,
//     category: "Electronics",
//     subcategory: "Smart Watches",
//     condition: "Like New",
//     price: 420000,
//     negotiable: true,
//     currency: "MK",
//     images: ["/uploads/watch1.png", "/uploads/watch2.png"],
//     city: "Mathura",
//     location: "Park 7 Mathura",
//     deliveryAvailable: false,
//     views: 0,
//     favouritesCount: 0,
//     status: "Active",
//     featured: true,
//     reported: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
// ];

// // 🚀 Insert Function
// async function insertElectronics() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("🟢 Connected to MongoDB");

//     // 🧹 Clear existing Electronics items
//     const deleted = await Product.deleteMany({ category: "Electronics" });
//     console.log(`🧹 Deleted ${deleted.deletedCount} old Electronics items`);

//     // 📥 Insert fresh data
//     await Product.insertMany(electronicsAds);
//     console.log(`✅ Inserted ${electronicsAds.length} new Electronics items`);

//   } catch (err) {
//     console.error("❌ Error inserting data:", err);
//   } finally {
//     await mongoose.disconnect();
//     console.log("🔌 MongoDB connection closed");
//   }
// }

// insertElectronics();





// import mongoose from "mongoose";

// // 🔗 MongoDB Connection URI
// const MONGO_URI =
//   "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/ecommerceDB?retryWrites=true&w=majority";

// // 🧱 Connect to MongoDB
// const connectDB = async () => {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ MongoDB connected successfully");

//     // 🔹 Delete all messages
//     const result = await mongoose.connection.db
//       .collection("messages")
//       .deleteMany({});

//     console.log(`🗑️ Deleted ${result.deletedCount} messages successfully`);
//   } catch (error) {
//     console.error("❌ Error deleting messages:", error);
//   } finally {
//     await mongoose.disconnect();
//     console.log("🔌 Disconnected from MongoDB");
//   }
// };

// // 🏃 Run the script
// connectDB();



// import mongoose from "mongoose";

// // ✅ MongoDB URI (use your existing one)
// const MONGO_URI =
//   "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/ecommerceDB?retryWrites=true&w=majority";

// // ✅ Define Ad Schema (only the fields we need)
// const adSchema = new mongoose.Schema({}, { strict: false });
// const Ad = mongoose.model("Ad", adSchema, "ads"); // 3rd arg ensures it targets your 'ads' collection

// // 🧩 Helper Functions
// const getRandomYear = () => {
//   const min = 2005;
//   const max = 2025;
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// };

// const getRandomMileage = () => {
//   const min = 5000;
//   const max = 250000;
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// };

// // 🚀 Main Script
// const updateVehicles = async () => {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ Connected to MongoDB...");

//     // Find all ads in category 'Vehicles'
//     const vehicles = await Ad.find({ category: "Vehicles" });
//     console.log(`Found ${vehicles.length} vehicle ads.`);

//     let updatedCount = 0;

//     for (const ad of vehicles) {
//       let updated = false;

//       // Add missing year or mileage with random values
//       if (!ad.year || ad.year === "") {
//         ad.year = getRandomYear();
//         updated = true;
//       }
//       if (!ad.mileage || ad.mileage === "") {
//         ad.mileage = getRandomMileage();
//         updated = true;
//       }

//       if (updated) {
//         await ad.save();
//         updatedCount++;
//       }
//     }

//     console.log(`✅ Updated ${updatedCount} vehicle ads with random year/mileage.`);
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error updating vehicles:", err);
//     process.exit(1);
//   }
// };

// updateVehicles();


// // migrateUploads.js
// import dotenv from "dotenv";
// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";
// import path from "path";
// import mongoose from "mongoose";
// import Ad from "./models/Ad.js";
// import connectDB from "./config/db.js";

// dotenv.config();
// await connectDB();

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Absolute uploads folder
// const __dirname = path.resolve();
// const uploadsDir = path.join(__dirname, "uploads");

// console.log("🧭 Checking old uploads at:", uploadsDir);

// const migrate = async () => {
//   try {
//     const ads = await Ad.find({
//       images: { $exists: true, $ne: [] },
//     });

//     console.log(`📦 Found ${ads.length} ads with local image paths`);

//     for (const ad of ads) {
//       const newUrls = [];

//       for (const imgPath of ad.images) {
//         // Check only local paths (not already on Cloudinary)
//         if (imgPath.startsWith("/uploads/")) {
//           const filename = imgPath.split("/").pop();
//           const localPath = path.join(uploadsDir, filename);

//           if (fs.existsSync(localPath)) {
//             try {
//               const uploadRes = await cloudinary.uploader.upload(localPath, {
//                 folder: "zitheke_uploads",
//               });
//               newUrls.push(uploadRes.secure_url);
//               console.log("✅ Uploaded:", uploadRes.secure_url);
//             } catch (err) {
//               console.error("❌ Upload failed for:", filename, err.message);
//             }
//           } else {
//             console.warn("⚠️ File not found:", filename);
//           }
//         } else {
//           newUrls.push(imgPath); // keep Cloudinary links as-is
//         }
//       }

//       if (newUrls.length > 0) {
//         ad.images = newUrls;
//         await ad.save();
//         console.log(`🆙 Updated Ad: ${ad.title}`);
//       }
//     }

//     console.log("🎉 Migration complete!");
//     mongoose.connection.close();
//   } catch (error) {
//     console.error("❌ Migration failed:", error);
//     mongoose.connection.close();
//   }
// };

// migrate();
// updatePhone.js


// import mongoose from "mongoose";

// // 1️⃣ Use your REAL database name here
// const MONGO_URI =
//   "mongodb+srv://alinafe:dfHC2WiE7NUavDjQ@alinafe.lxc6cvj.mongodb.net/Zitheke?retryWrites=true&w=majority";

// async function updateOwnerPhone() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("MongoDB connected ✔");

//     const sellerEmail = "nextgencodex@gmail.com";
//     const newPhone = "6397632458";

//     const result = await mongoose.connection
//       .collection("ads")
//       .updateMany(
//         { ownerEmail: sellerEmail },
//         { $set: { ownerPhone: newPhone } }
//       );

//     console.log(`Updated ${result.modifiedCount} ads ✔`);
//     process.exit();
//   } catch (err) {
//     console.error("Error:", err);
//     process.exit(1);
//   }
// }

// updateOwnerPhone();



// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Ad from "../models/Ad.js"; // path check kar lena

// dotenv.config();

// const MONGO_URI = process.env.MONGO_URI;

// const migrate = async () => {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ MongoDB connected");

//     /* =========================
//        🚗 VEHICLES
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Vehicles",
//         brand: { $exists: false },
//       },
//       {
//         $set: {
//           brand: "",
//           year: "",
//           mileage: "",
//           fuelType: "",
//         },
//       }
//     );

//     /* =========================
//        🏠 REAL ESTATE
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Real Estate",
//         bedrooms: { $exists: false },
//       },
//       {
//         $set: {
//           bedrooms: "",
//           bathrooms: "",
//           area: "",
//           furnishing: "",
//         },
//       }
//     );

//     /* =========================
//        📱 MOBILES
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Mobiles",
//         brand: { $exists: false },
//       },
//       {
//         $set: {
//           brand: "",
//           model: "",
//           storage: "",
//           warranty: "",
//         },
//       }
//     );

//     /* =========================
//        💻 ELECTRONICS
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Electronics",
//         brand: { $exists: false },
//       },
//       {
//         $set: {
//           brand: "",
//           model: "",
//           warranty: "",
//           conditionNote: "",
//         },
//       }
//     );

//     /* =========================
//        🛋️ HOME FURNITURE
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "HomeFurniture",
//         material: { $exists: false },
//       },
//       {
//         $set: {
//           material: "",
//           brand: "",
//           dimensions: "",
//           conditionNote: "",
//         },
//       }
//     );

//     /* =========================
//        🧸 KIDS
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Kids",
//         ageGroup: { $exists: false },
//       },
//       {
//         $set: {
//           ageGroup: "",
//           brand: "",
//           material: "",
//           conditionNote: "",
//         },
//       }
//     );

//     /* =========================
//        🏏 SPORTS
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Sports",
//         sportType: { $exists: false },
//       },
//       {
//         $set: {
//           sportType: "",
//           brand: "",
//           size: "",
//           conditionNote: "",
//         },
//       }
//     );

//     /* =========================
//        👗 FASHION
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Fashion",
//         size: { $exists: false },
//       },
//       {
//         $set: {
//           size: "",
//           color: "",
//           brand: "",
//           material: "",
//         },
//       }
//     );

//     /* =========================
//        📚 BOOKS
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Books",
//         author: { $exists: false },
//       },
//       {
//         $set: {
//           author: "",
//           publisher: "",
//           edition: "",
//           language: "",
//         },
//       }
//     );

//     /* =========================
//        🐶 PETS
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Pets",
//         petType: { $exists: false },
//       },
//       {
//         $set: {
//           petType: "",
//           breed: "",
//           age: "",
//           vaccinated: "",
//         },
//       }
//     );

//     /* =========================
//        🛠️ SERVICES
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Services",
//         serviceType: { $exists: false },
//       },
//       {
//         $set: {
//           serviceType: "",
//           experience: "",
//           availability: "",
//           serviceArea: "",
//         },
//       }
//     );

//     /* =========================
//        💼 JOBS
//     ========================= */
//     await Ad.updateMany(
//       {
//         category: "Jobs",
//         jobType: { $exists: false },
//       },
//       {
//         $set: {
//           salary: null,
//           jobType: "",
//           experience: "",
//           company: "",
//         },
//       }
//     );

//     console.log("🎉 MIGRATION COMPLETED SUCCESSFULLY");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Migration failed:", err);
//     process.exit(1);
//   }
// };

// migrate();



// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Ad from "../backend/models/Ad.js"; // path check kar lena

// dotenv.config();

// const MONGO_URI = process.env.MONGO_URI;

// const run = async () => {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ MongoDB connected");

//     const result = await Ad.updateMany(
//       {
//         category: "Real Estate",
//         furnishing: { $exists: false }, // 👈 sirf purane ads
//       },
//       {
//         $set: {
//           furnishing: "", // default empty
//         },
//       }
//     );

//     console.log(
//       `🏠 Real Estate ads updated: ${result.modifiedCount}`
//     );

//     console.log("🎉 DONE: furnishing added to existing ads only");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error:", err);
//     process.exit(1);
//   }
// };

// run();



// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import User from "./models/User.js";

// dotenv.config();

// const MONGO_URI = process.env.MONGO_URI;

// const fixEmptyUserNames = async () => {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("✅ MongoDB Connected");

//     const users = await User.find({ name: "" });

//     console.log(`🔍 Found ${users.length} users with empty name`);

//     for (const user of users) {
//       const fallbackName = user.email.split("@")[0];
//       user.name = fallbackName;
//       await user.save();

//       console.log(`✔ Fixed user: ${user.email} → ${fallbackName}`);
//     }

//     console.log("🎉 User name fix completed");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error fixing users:", err);
//     process.exit(1);
//   }
// };

// fixEmptyUserNames();






// // scripts/clearChats.js

// import mongoose from "mongoose";
// import dotenv from "dotenv";

// import Message from "./models/Message.js";
// import Conversation from "./models/Conversation.js";

// dotenv.config();

// const run = async () => {
//   try {
//     console.log("🔌 Connecting to MongoDB Atlas...");

//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log("✅ MongoDB Connected");

//     // 🔥 DELETE ALL MESSAGES
//     const msgResult = await Message.deleteMany({});
//     console.log(`🗑️ Messages deleted: ${msgResult.deletedCount}`);

//     // 🔥 DELETE ALL CONVERSATIONS
//     const convoResult = await Conversation.deleteMany({});
//     console.log(`🗑️ Conversations deleted: ${convoResult.deletedCount}`);

//     console.log("✅ ALL CHAT DATA CLEARED SUCCESSFULLY");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error clearing chat data:", err);
//     process.exit(1);
//   }
// };

// run();







// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Category from "./models/Category.js";
// import Service from "./models/Service.js";

// dotenv.config();

// const seedSearchData = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     // 🔥 CLEAR OLD DATA (safe to re-run)
//     await Category.deleteMany({});
//     await Service.deleteMany({});

//     // =========================
//     // 📂 CATEGORIES
//     // =========================
//     await Category.insertMany([
//       { name: "Cars", slug: "cars", keywords: ["car", "sedan", "suv", "vehicle"] },
//       { name: "Bikes", slug: "bikes", keywords: ["bike", "motorcycle"] },
//       { name: "Mobiles", slug: "mobiles", keywords: ["phone", "iphone", "android"] },
//       { name: "Electronics", slug: "electronics", keywords: ["tv", "laptop", "computer"] },
//       { name: "Real Estate", slug: "real-estate", keywords: ["house", "flat", "plot"] },
//       { name: "Jobs", slug: "jobs", keywords: ["job", "vacancy", "hiring"] },
//       { name: "Services", slug: "services", keywords: ["service", "repair"] },
//       { name: "Fashion", slug: "fashion", keywords: ["clothes", "shoes"] },
//       { name: "Pets", slug: "pets", keywords: ["dog", "cat"] },
//       { name: "Agriculture", slug: "agriculture", keywords: ["farm", "tractor"] },
//     ]);

//     // =========================
//     // 🛠 SERVICES
//     // =========================
//     await Service.insertMany([
//       { name: "Carpenter", category: "Services", keywords: ["wood", "furniture"] },
//       { name: "Plumber", category: "Services", keywords: ["pipe", "water"] },
//       { name: "Electrician", category: "Services", keywords: ["electric", "wiring"] },
//       { name: "Taxi Service", category: "Services", keywords: ["car", "cab"] },
//       { name: "Home Cleaning", category: "Services", keywords: ["cleaning", "house"] },
//       { name: "CCTV Installation", category: "Services", keywords: ["camera", "security"] },
//     ]);

//     console.log("✅ Search seed data inserted successfully");
//     process.exit();
//   } catch (error) {
//     console.error("❌ Seed error:", error);
//     process.exit(1);
//   }
// };

// seedSearchData();

// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Category from "./models/Category.js";

// dotenv.config();

// const seedSearchData = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     await Category.updateOne(
//       { name: "Sports" },
//       {
//         $set: {
//           sportTypes: [
//             "Yoga",
//             "Gym & Fitness",
//             "Cricket",
//             "Football",
//             "Badminton",
//             "Cycling",
//             "Running",
//             "Meditation",
//           ],
//         },
//       },
//       { upsert: true }
//     );

//     console.log("✅ Sports category updated with sportTypes");
//     process.exit();
//   } catch (error) {
//     console.error(error);
//     process.exit(1);
//   }
// };

// seedSearchData();







import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "./models/Category.js";
import Ad from "./models/Ad.js";

dotenv.config();

async function run() {
  // 🔁 CHANGE DIRECTION HERE
  const from = "HomeFurniture";
  const to = "Furniture";

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // 1️⃣ Update Category collection
    const catRes = await Category.updateMany(
      { name: from },
      { $set: { name: to } }
    );

    console.log(
      `✅ Category updated → matched=${catRes.matchedCount}, modified=${catRes.modifiedCount}`
    );

    // 2️⃣ Update Ads collection
    const adRes = await Ad.updateMany(
      { category: from },
      { $set: { category: to } }
    );

    console.log(
      `✅ Ads updated → matched=${adRes.matchedCount}, modified=${adRes.modifiedCount}`
    );

    console.log("🎉 Category rename completed successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

run();
