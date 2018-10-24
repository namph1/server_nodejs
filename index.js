var server = require("ws").Server;
var express = require("express");
var app = express();
var serverHttp = require("http").Server(app);
var io = require("socket.io")(serverHttp);

var s = new server({ port: 5001 });

var sql = require("mssql");
var md5 = require("md5");
const crypto = require("crypto");

net = require("net");

net
  .createServer(function(socket) {
    socket.on("data", function(data) {
      var msg_json = JSON.parse(data);
      console.log("DATA " + socket.remoteAddress + ": " + msg_json.lstHangHoa);
      var makh = msg_json.makh;

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
            var idkey = msg_json.idkey;
            var soluong = msg_json.lstHangHoa[i];
            count++;
            request.query(
              " UPDATE [SMSNganHang].[dbo].[TBL_DONHANG_MOBILE] SET SO_LUONG =  " +
                soluong +
                " WHERE IDKEY='" +
                idkey +
                "' and MATP= '" +
                mtp +
                "';",
              function(err, recordset) {
                if (err) console.log(err);
                // console.log(count);
                if (count == length) {
                  sql.close();
                }
              }
            );
          }
          socket.write("dodai " + length);
        }
      );
    });
  })
  .listen(5003);

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

app.get("/insertNew", function(req, res) {
  var data = req.param("data");
  var msg_json = JSON.parse(data);
  var makh = msg_json.makh;
  var token = req.param("token");
  if (mapToken.has(token)) {
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
              "'," +
              soluong +
              ");",
            function(err, recordset) {
              if (err) console.log(err);
              // console.log(count);
              if (count == length) {
                sql.close();
              }
            }
          );
        }
      }
    );
    res.send("OK");
  } else {
    res.send("ERROR");
  }
});

//get san luong chung

app.get("/home", function(req, res) {
  var token = req.param("token");
  if (mapToken.has(token)) {
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
  } else {
    res.send("ERROR");
  }
});

//get khoan
app.get("/khoan", function(req, res) {
  var id = req.param("id");
  var token = req.param("token");
  if (mapToken.has(token)) {
    sql.connect(
      configHD,
      function(err) {
        if (err) console.log(err);
        var request = new sql.Request();

        var sQeuery =
          "select DMKhoanCT.ID,DMKhoanCT.MaKH,DMKhoanCT.SoTan,DMKhoanCT.NguoiSua,DMKhoanCT.NgaySua, DMKH.TEN_KHACH_HANG TenKH, DMKH.DiaChiTat from DMKhoanCT DMKhoanCT inner join DM_Khach_Hang DMKH on DMKhoanCT.MaKH=DMKH.MKH ";
        if (id == 1) {
          sQeuery += " where DMKhoanCT.ID= (SELECT MAX(ID) FROM DMKhoan);";
        } else if (id == 2) {
          sQeuery += " where DMKhoanCT.ID= (SELECT MAX(ID)-1 FROM DMKhoan);";
        }
        request.query(sQeuery, function(err, recordset) {
          if (err) console.log(err);
          res.send(JSON.stringify(recordset.recordset));
          sql.close();
        });
      }
    );
  } else {
    res.send("ERROR");
  }
});

app.get("/khoanchitiet", function(req, res) {
  var id = req.param("id");
  var manvtt = req.param("manvtt");
  var token = req.param("token");
  if (mapToken.has(token)) {
    sql.connect(
      configHD,
      function(err) {
        if (err) console.log(err);
        var request = new sql.Request();

        var sQeuery = "exec Tien_BaoCaoKhoan2 '" + manvtt + "'," + id + ",1100";

        request.query(sQeuery, function(err, recordset) {
          if (err) console.log(err);
          res.send(JSON.stringify(recordset.recordset));
          sql.close();
        });
      }
    );
  } else {
    res.send("ERROR");
  }
});

//danh sach khoan
app.get("/dmkhoan", function(req, res) {
  var token = req.param("token");
  if (mapToken.has(token)) {
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
  } else {
    res.send("ERROR");
  }
});
/**
 * GET DANH SACH DON DAT HANG
 */

app.get("/dondathang", function(req, res) {
  var manvtt = req.param("mnvtt");
  var type = req.param("type");
  var token = req.param("token");
  if (mapToken.has(token)) {
    sql.connect(
      configHD,
      function(err) {
        if (err) console.log(err);
        var request = new sql.Request();

        request.query(
          'exec VINA_IAS.dbo.Tien_BaoCaoDSDatHang "' + manvtt + '",1,1;',
          function(err, recordset) {
            if (err) console.log(err);

            var data = recordset.recordset;
            if (type == 2) {
              var i = 0;
              while (i < data.length) {
                // chua xuat
                if (
                  data[i].TrangThai === "Cân Lần 1" ||
                  data[i].TrangThai === ""
                ) {
                  data.splice(i, 1);
                } else {
                  i++;
                }
              }
            } else if (type == 1) {
              //da xuat
              var i = 0;
              while (i < data.length) {
                if (
                  data[i].TrangThai === "Phiếu Xuất" ||
                  data[i].TrangThai === "Cân Lần 2"
                ) {
                  data.splice(i, 1);
                } else {
                  i++;
                }
              }
            }
            res.send(JSON.stringify(data));

            sql.close();
          }
        );
      }
    );
  } else {
    res.send("ERROR");
  }
});

/**
 * GET DANH SACH HANG HOA THEO DAI LY
 */

app.get("/dshanghoadaily", function(req, res) {
  var madt = req.param("madt");
  var token = req.param("token");
  if (mapToken.has(token)) {
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
  } else {
    res.send("ERROR");
  }
});

/**
 * GET DANH SACH DAI LY THEO TIEP THI
 */

app.get("/getdailytheotiepthi", function(req, res) {
  var manv = req.param("manv");
  var token = req.param("token");
  if (mapToken.has(token)) {
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
  } else {
    res.send("ERROR");
  }
});

/**
 * Get cong no hien tai tong hop
 */
app.get("/getcongnohientaitonghop", function(req, res) {
  var manv = req.param("manv");
  var token = req.param("token");
  if (mapToken.has(token)) {
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
  } else {
    res.send("ERROR");
  }
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
  var token = req.param("token");
  if (mapToken.has(token)) {
    sql.connect(
      configHD,
      function(err) {
        if (err) console.log(err);
        var request = new sql.Request();

        request.query(
          " exec Tien_BC_CONGNO_Ngay '" +
            madt +
            "','" +
            from +
            "','" +
            to +
            "'",
          function(err, recordset) {
            if (err) console.log(err);
            res.send(JSON.stringify(recordset.recordset));
            sql.close();
          }
        );
      }
    );
  } else {
    res.send("ERROR");
  }
});

/**
 * get ton kho hai duong.
 */
app.get("/gettonkho", function(req, res) {
  var token = req.param("token");
  if (mapToken.has(token)) {
    sql.connect(
      configHD,
      function(err) {
        if (err) console.log(err);
        var request = new sql.Request();
        var sQeuery = "exec Tien_TongHopDDHChuaXuat 0;";
        request.query(sQeuery, function(err, recordset) {
          if (err) console.log(err);
          res.send(JSON.stringify(recordset.recordset));
          sql.close();
        });
      }
    );
  } else {
    res.send("ERROR");
  }
});

app.get("/getchitietdonhang", function(req, res) {
  var idkey = req.param("idkey");
  var token = req.param("token");
  if (mapToken.has(token)) {
    sql.connect(
      configHD,
      function(err) {
        if (err) console.log(err);
        var request = new sql.Request();
        // var sQeuery =
        //   "Select STT, CT_DDH.MATP, DMTP.TENTP ,SoLuong, DonGia, Tien, KhoiLuong, baobi.TEN_BAO_BI,0 SLKho, 0 SLKhoDH  ";
        //   sQeuery += " from CT_DDH JOIN DMTP on CT_DDH.matp= DMTP.MATP  ";
        //   sQeuery += " join DM_BAO_BI baobi on baobi.MBB = DMTP.MBB  ";
        //   sQeuery += "  where IDKEY='" + idkey +"'order by STT;";
        var sQeuery = "exec Tien_So_Ton_CuaCacTPTrongDDH '" + idkey + "';";
        request.query(sQeuery, function(err, recordset) {
          if (err) console.log(err);
          res.send(JSON.stringify(recordset.recordset));
          sql.close();
        });
      }
    );
  } else {
    res.send("ERROR");
  }
});

console.log("Start server at " + new Date().toLocaleString());
let mapToken = new Map();

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
          console.log(token);
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
              mapToken.set(token, new Date().getTime());
              sql.close();
            }
          );
        }
      );
    } else if (msg_json.action == "DONHANG_ACTION") {
      var makh = msg_json.makh;

      sql.connect(
        config_test,
        function(err) {
          if (err) console.log(err);
          var request = new sql.Request();
          var count = 0;
          var length = Object.keys(msg_json.lstHangHoa).length;
          // console.log(length);
          for (var i in msg_json.lstHangHoa) {
            var mtp = i;
            var soluong = msg_json.lstHangHoa[i];
            count++;
            request.query(
              "INSERT INTO SMSNganHang.DBO.TBL_DONHANG_MOBILE(MADT, MATP, SO_LUONG) VALUES('" +
                makh +
                "','" +
                mtp +
                "'," +
                soluong +
                ");",
              function(err, recordset) {
                if (err) console.log(err);
                // console.log(count);
                if (count == length) {
                  sql.close();
                }
              }
            );
          }
        }
      );
    }
  });
});
