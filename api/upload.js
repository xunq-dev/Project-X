import AWS from "aws-sdk";
import multer from "multer";
import nextConnect from "next-connect";

const SECRET_PATH = "kirksteinv5";
const FOLDER = "kirkstein";

// R2 setup
const s3 = new AWS.S3({
  endpoint: "https://d553adbdfb781bd758d0c3339fdfb32c.r2.cloudflarestorage.com",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: "v4"
});

const BUCKET = process.env.AWS_BUCKET_NAME;
const DOMAIN = process.env.DOMAIN;

// upload handler
const upload = multer({ storage: multer.memoryStorage() });

const app = nextConnect();

app.use(upload.single("file"));

// ---------- UI PAGE ----------
app.get((req, res) => {

  if (!req.url.includes(SECRET_PATH)) {
    res.status(404).send("404");
    return;
  }

  res.send(`
  <html>
  <body style="background:#111;color:white;font-family:sans-serif;text-align:center;padding-top:100px;">
  
  <h2>Upload File</h2>

  <input type="file" id="file"/>
  <button onclick="upload()">Upload</button>

  <p id="result"></p>

  <script>
  async function upload(){
      const file = document.getElementById("file").files[0];
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload",{
          method:"POST",
          body:form
      });

      const data = await res.json();
      document.getElementById("result").innerHTML =
        '<a href="'+data.url+'" target="_blank">'+data.url+'</a>';
  }
  </script>

  </body>
  </html>
  `);
});

// ---------- UPLOAD ----------
app.post(async (req,res)=>{

  try{

    if(!req.file){
      return res.status(400).json({error:"No file"});
    }

    const name = Date.now()+"_"+req.file.originalname;
    const key = `${FOLDER}/${name}`;

    await s3.putObject({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL:"public-read"
    }).promise();

    const url = `${DOMAIN}/${key}`;

    res.json({url});

  }catch(e){
    res.status(500).json({error:"upload failed"});
  }

});

export const config = {
  api:{ bodyParser:false }
};

export default app;
