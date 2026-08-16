<%@ WebHandler Language="VB" Class="FileVB" %>

Imports System
Imports System.Web
Imports System.Data
Imports System.Data.SqlClient
Imports System.Configuration
Imports DocManage
Imports System.Web.Configuration
 
Public Class FileVB : Implements IHttpHandler
   
    Public Sub ProcessRequest(ByVal context As HttpContext) Implements IHttpHandler.ProcessRequest
        Dim id As Integer = Integer.Parse(context.Request.QueryString("id"))
        Dim bytes As Byte()
        Dim fileName As String = "", contentType As String = ""
        Dim myID As Double = 0
        'DEPART_CODE,AREA_CODE,UNIT,ENTRYDATE,ENTEREDBY
        Dim EnctryptionAlgorith As String = "rijndael"
        Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
        Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

        Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

        'Dim myConnection As New SqlConnection(DecryptedStr)
        'myConnection.Open()
        Using con As New SqlConnection(DecryptedStr)
            Using cmd As New SqlCommand()
                cmd.CommandText = "SELECT  [Data],[FILE_NAME],ContentType  FROM [Doc_Arc_DB].dbo.[TBL_MIS_CR_DOCS] WHERE [DOC_ID]=@Id"
                cmd.Parameters.AddWithValue("@Id", id)
                cmd.Connection = con
                con.Open()
                Using sdr As SqlDataReader = cmd.ExecuteReader()
                    sdr.Read()
                    If sdr.HasRows Then
                        bytes = DirectCast(sdr("Data"), Byte())
                        contentType = sdr("ContentType").ToString()
                        fileName = sdr("FILE_NAME").ToString()
                     
                    End If
                   
                End Using
                con.Close()
            End Using
        End Using
        
        context.Response.Buffer = True
        context.Response.Charset = ""
   
        If contentType <> "application/pdf" Then
            context.Response.AppendHeader("Content-Disposition", Convert.ToString("attachment; filename=") & fileName)
        End If
        context.Response.Cache.SetCacheability(HttpCacheability.NoCache)
        context.Response.ContentType = contentType
        context.Response.BinaryWrite(bytes)
        context.Response.Flush()
        context.Response.[End]()
       
       
    End Sub
 
    Public ReadOnly Property IsReusable() As Boolean Implements IHttpHandler.IsReusable
        Get
            Return False
        End Get
    End Property
End Class