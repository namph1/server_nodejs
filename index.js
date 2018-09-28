var server = require("ws").Server;
var express = require("express");
var app = express();
var serverHttp = require("http").Server(app);
var io = require("socket.io")(serverHttp);

var s = new server({ port: 5001 });

var sql = require("mssql");
var md5 = require("md5");
const crypto = require("crypto");

var config = {
  user: "sa",
  password: "vinavina",
  server: "192.168.30.8",
  database: "VINA_CHUNG"
};

var configHD = {
  user: "sa",
  password: "vinavina",
  server: "10.0.0.100",
  database: "VINA_IAS"
};

var config_test = {
  user: "sa",
  password: "vinavina",
  server: "10.0.0.100",
  database: "SMSNganHang"
};

serverHttp.listen(process.env.PORT || 5000);

//get san luong chung

app.get("/home", function(req, res) {
  sql.connect(
    config,
    function(err) {
      if (err) console.log(err);
      var request = new sql.Request();

      request.query(
        'exec VINA_Chung.dbo.GetSanLuongHienTai "namph", 1;',
        function(err, recordset) {
          if (err) console.log(err);
          res.send(JSON.stringify(recordset.recordset));
          sql.close();
        }
      );
    }
  );
});

//get khoan
app.get("/khoan", function(req, res) {
  sql.connect(
    configHD,
    function(err) {
      if (err) console.log(err);
      var request = new sql.Request();
      var sQeuery =
        "select DMKhoanCT.ID,DMKhoanCT.MaKH,DMKhoanCT.SoTan,DMKhoanCT.NguoiSua,DMKhoanCT.NgaySua, DMKH.TEN_KHACH_HANG TenKH, DMKH.DiaChiTat from DMKhoanCT DMKhoanCT inner join DM_Khach_Hang DMKH on DMKhoanCT.MaKH=DMKH.MKH where ID= 55;";
      request.query(sQeuery, function(err, recordset) {
        if (err) console.log(err);
        res.send(JSON.stringify(recordset.recordset));
        sql.close();
      });
    }
  );
});

//danh sach khoan
app.get("/dmkhoan", function(req, res) {
  sql.connect(
    configHD,
    function(err) {
      if (err) console.log(err);
      var request = new sql.Request();
      var sQeuery =
        "select TOP 7 DMKhoan.ID, DMKhoan.Ten from DMKhoan order by id desc;";
      request.query(sQeuery, function(err, recordset) {
        if (err) console.log(err);
        res.send(JSON.stringify(recordset.recordset));
        sql.close();
      });
    }
  );
});
/**
 * GET DANH SACH DON DAT HANG
 */

app.get("/dondathang", function(req, res) {
  var manvtt = req.param("mnvtt");
  sql.connect(
    configHD,
    function(err) {
      if (err) console.log(err);
      var request = new sql.Request();

      request.query(
        'exec VINA_IAS.dbo.Tien_BaoCaoDSDatHang "' + manvtt + '",1,1;',
        function(err, recordset) {
          if (err) console.log(err);
          res.send(JSON.stringify(recordset.recordset));
          sql.close();
        }
      );
    }
  );
});

/**
 * GET DANH SACH HANG HOA THEO DAI LY
 */

app.get("/dshanghoadaily", function(req, res) {
  var madt = req.param("madt");
  sql.connect(
    configHD,
    function(err) {
      if (err) console.log(err);
      var request = new sql.Request();

      request.query(
        " select DMTP.MATP, DMTP.TENTP, DMTP.TENTP + ' (' + DMBB.TEN_BAO_BI + ')' TenFull " +
          " from Hoa_Don HD inner join CTHD CTHD on HD.IDKEY=CTHD.IDKEY " +
          " inner join DMTP DMTP on CTHD.MATP=DMTP.MATP " +
          " inner join DM_BAO_BI DMBB on DMTP.MBB=DMBB.MBB " +
          " where HD.Ngay>=dateadd(day,-60,getdate()) " +
          " and HD.MADT='" +
          madt +
          "'" +
          " group by DMTP.MATP, DMTP.TENTP, DMBB.TEN_BAO_BI order by DMTP.TENTP; ",
        function(err, recordset) {
          if (err) console.log(err);
          res.send(JSON.stringify(recordset.recordset));
          sql.close();
        }
      );
    }
  );
});

/**
 * GET DANH SACH DAI LY THEO TIEP THI
 */

app.get("/getdailytheotiepthi", function(req, res) {
  var manv = req.param("manv");
  sql.connect(
    configHD,
    function(err) {
      if (err) console.log(err);
      var request = new sql.Request();

      request.query(
        " select MKH, TEN_KHACH_HANG, DIA_CHI, MKH + N' - ' + TEN_KHACH_HANG + N' (' + DiaChiTat + N')'  TenKH  " +
          " from DM_KHACH_HANG where Isnull(KhongDung,0)=0  " +
          " and (('1' + MKH)='" +
          manv +
          "' or (MNVTT in (select * from getdsnhanvien('" +
          manv +
          "')))); ",
        function(err, recordset) {
          if (err) console.log(err);
          res.send(JSON.stringify(recordset.recordset));
          sql.close();
        }
      );
    }
  );
});

/**
 * Get cong no hien tai tong hop
 */
app.get("/getcongnohientaitonghop", function(req, res) {
  var manv = req.param("manv");
  sql.connect(
    configHD,
    function(err) {
      if (err) console.log(err);
      var request = new sql.Request();

      request.query(" exec Tien_BaoCaoNoQuaHan '" + manv + "',1", function(
        err,
        recordset
      ) {
        if (err) console.log(err);
        res.send(JSON.stringify(recordset.recordset));
        sql.close();
      });
    }
  );
});

/**
 * Get chi tiet cong no tu ngay toi ngay cua khach hang
 */
app.get("/getdetailfromto", function(req, res) {
  var madt = req.param("madt");
  var month_year = req.param("month");
  var month = month_year.split("-")[0];
  var year = month_year.split("-")[1];
  var from = year + "-" + month + "-01";
  var d = new Date(2008, month, 0);
  var to = year + "-" + month + "-" + d.getDate();
  sql.connect(
    configHD,
    function(err) {
      if (err) console.log(err);
      var request = new sql.Request();

      request.query(" exec Tien_BC_CONGNO_Ngay '" + madt + "','"+from+"','"+ to +"'", function(
        err,
        recordset
      ) {
        if (err) console.log(err);
        res.send(JSON.stringify(recordset.recordset));
        sql.close();
      });
    }
  );
});

console.log("Start server at " + new Date().toLocaleString());

s.on("connection", function(ws, req) {
  // const secret = "abcdefg";
  // const hash = crypto
  //   .createHmac("sha256", secret)
  //   .update("I love cupcakes")
  //   .digest("hex");
  // console.log(hash);

  ws.on("message", function(message) {
    var msg_json = JSON.parse(message);
    if (msg_json.action == "LOGIN_ACTION") {
      sql.connect(
        config,
        function(err) {
          if (err) console.log(err);
          var request = new sql.Request();
          var token = md5(msg_json.user + msg_json.pass);
          request.query(
            "select MNVTT,TEN_NHAN_VIEN, e_mail,'" +
              token +
              "' token,0 Cty, Isnull(IsCaoNhat,0) IsCaoNhat, DIEN_THOAI_1 FROM VINA_IAS.dbo.DM_Nhan_Vien_TT where MNVTT='" +
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
    } else if (msg_json.action == "DONHANG_ACTION") {
      var makh = msg_json.makh;
      sql.close();
      sql.connect(
        config_test,
        function(err) {
          if (err) console.log(err);
          var request = new sql.Request();
          var count = 0;
          var length = Object.keys(msg_json.lstHangHoa).length;
          console.log(length);
          for (var i in msg_json.lstHangHoa) {
            var mtp = i;
            var soluong = msg_json.lstHangHoa[i];
            count++;
            request.query(
              "INSERT INTO SMSNganHang.DBO.TBL_DONHANG_MOBILE(MADT, MATP, SO_LUONG) VALUES('" +
                makh +
                "','" +
                mtp +
                "','" +
                soluong +
                "');",
              function(err, recordset) {
                if (err) console.log(err);
                console.log(count);
                if (count == length) {
                  // sql.close();
                }
              }
            );
          }
        }
      );
    }
  });
});
