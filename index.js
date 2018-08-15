var server = require("ws").Server;

var s = new server({ port: 5001 });

var sql = require("mssql");
var md5 = require("md5");
const crypto = require("crypto");

var config = {
  user: "sa",
  password: "vinavina",
  // server: '10.0.0.100',
  server: "192.168.30.8",
  database: "VINA_CHUNG"
};

s.on("connection", function(ws) {
  const secret = "abcdefg";
  const hash = crypto
    .createHmac("sha256", secret)
    .update("I love cupcakes")
    .digest("hex");
  console.log(hash);

  ws.on("message", function(message) {
    console.log("Received: " + message);
    var msg_json = JSON.parse(message);
    console.log(msg_json.action);
    if (msg_json.action == "LOGIN_ACTION") {
      sql.connect(
        config,
        function(err) {
          if (err) console.log(err);
          var request = new sql.Request();
          var token = md5(msg_json.user+msg_json.pass);
          request.query(
              "select TEN_NHAN_VIEN, e_mail,'" + token +"' token,0 Cty, Isnull(IsCaoNhat,0) IsCaoNhat, DIEN_THOAI_1 FROM VINA_IAS.dbo.DM_Nhan_Vien_TT where MNVTT='" +
              msg_json.user +
              "' and pwd='" +
              msg_json.pass +
              "';",
            function(err, recordset) {
              if (err) console.log(err);
                console.log(JSON.stringify(recordset.recordset));
                ws.send(JSON.stringify(recordset.recordset));
                sql.close();
            }
          );
        }
      );
    }

    // sql.connect(config, function (err) {
    //     if (err) console.log(err);
    //     var request = new sql.Request();

    //     request.query('exec VINA_Chung.dbo.GetSanLuongHienTai "namph", 1;', function (err, recordset) {

    //         if (err) console.log(err);
    //         // send records as a response
    //         console.log(md5(JSON.stringify(recordset.recordset)));
    //         ws.send(md5(JSON.stringify(recordset.recordset)));
    //         sql.close();
    //     });
    // });
  });
});
