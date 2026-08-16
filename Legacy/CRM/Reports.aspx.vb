Imports DocManage
Imports System.Data.Odbc
Imports System.IO
Imports System.Data
Imports System
Imports System.Collections
Imports System.Configuration
Imports Microsoft.VisualBasic
Imports System.Web.Configuration
Imports Telerik.Web.UI
Imports CrystalDecisions.CrystalReports.Engine
Imports CrystalDecisions.Shared
Imports System.Data.SqlClient
Imports Microsoft.Office.Interop
Imports System.Windows.Forms



Partial Class ReportViewer
    Inherits System.Web.UI.Page

    Dim MyDbAction As New DataManagement
    Dim rpt As New ReportDocument
    Dim tbs As Tables = Nothing
    Dim tb As Table = Nothing
    Dim cInfo As New ConnectionInfo
    Dim Reportpath As String = ""
    'Dim MyDataTable As New Data.DataTable("crb_individuals")
    Dim Reportname As String = ""
    Private MyReportViewing As ReportDocument

    Private Sub ShowReport()
        Try
         
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            'rpt.Close()
            Dim s As MemoryStream
            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            If Not Session("Reportname") Is Nothing Then

                If Not Session("EXCEL") Is Nothing Then

                    ExporttoExcel(Session("Mytable"), Session("Reportname"))

                End If

                'ExporttoExcel(Session("Mytable"))


                CrystalReportViewer1.ReportSource = Nothing

                '--------------------------------------------------------------


                Reportname = Session("Reportname")
                Session("ReportTitle") = Reportname
                Session("Company") = "AAR INSURANCE"
                Dim ExportedReports As String = Server.MapPath("GeneratedReports\" & Replace(Session("FullNames"), " ", "_"))
                Reportpath = Server.MapPath("~\Reports") & "\" & Reportname & ".rpt"
                rpt.Load(Reportpath)
                'rpt.SetParameterValue("@DISPLAY_MEMBERSHIP_NO", Session("MemberNo"))
                'crViewer.ReportSource = rpt
                rpt.SetDataSource(Session("Mytable"))
                tbs = rpt.Database.Tables
                Dim cn As New Data.Odbc.OdbcConnection(DecryptedStr)
                For Each tb In tbs
                    With cInfo
                        .ServerName = WebConfigurationManager.AppSettings("ReportServerName")
                        .Password = WebConfigurationManager.AppSettings("ReportPassword")
                        .UserID = WebConfigurationManager.AppSettings("ReportUsername")
                        '.DatabaseName = cn.Database
                        .DatabaseName = WebConfigurationManager.AppSettings("ReportdatbaseName")
                    End With
                    Dim lInfo As TableLogOnInfo = tb.LogOnInfo
                    lInfo.ConnectionInfo = cInfo
                    tb.ApplyLogOnInfo(lInfo)
                Next
                Dim str As String = String.Empty

                '/////////////////////////////////////
                'If Not Session("DISPLAY_MEMBERSHIP_NO") Is Nothing Then
                '    rpt.DataDefinition.RecordSelectionFormula = "left({Member_Account_Details;1.DISPLAY_MEMBERSHIP_NO},Len({Member_Account_Details;1.DISPLAY_MEMBERSHIP_NO})-2)='" & Session("DISPLAY_MEMBERSHIP_NO") & "'"
                'End If


                If Session("ReportTitle") IsNot Nothing Then
                    rpt.DataDefinition.FormulaFields("ReportTitle").Text = "'" & Session("ReportTitle") & "'"
                End If
                If Session("Company") IsNot Nothing Then
                    rpt.DataDefinition.FormulaFields("Company").Text = "'" & Session("Company") & "'"
                End If

                If Session("FrmDT") IsNot Nothing And Session("ToDt") IsNot Nothing Then
                    rpt.DataDefinition.FormulaFields("FrmDT").Text = "'" & Session("FrmDT") & "'"
                    rpt.DataDefinition.FormulaFields("ToDt").Text = "'" & Session("ToDt") & "'"
                End If
                CrystalReportViewer1.ReportSource = rpt
                s = rpt.ExportToStream(ExportFormatType.PortableDocFormat)

                If Session("PRINT") = "PDF" Then
                    HttpContext.Current.Response.ClearContent()
                    HttpContext.Current.Response.ClearHeaders()
                    HttpContext.Current.Response.ContentType = "application/pdf"
                    HttpContext.Current.Response.AddHeader("Content-Disposition", "inline; filename='" & Session("Reportname") & "'.pdf")
                    HttpContext.Current.Response.BinaryWrite(s.ToArray())
                    'HttpContext.Current.Response.End()
                End If


                CrystalReportViewer1.ReportSource = Nothing
                rpt.Database.Dispose()
                rpt.Refresh()
                rpt.Close()
                rpt.Dispose()

                'rpt.Close()

                'Session("ReportTitle") = Nothing
                Session("SelectionFormula") = Nothing
                Session("EXCEL") = Nothing
                Session("Reportname") = Nothing
                Session("PRINT") = Nothing

            End If
            Reportpath = Nothing
            Reportname = Nothing
            Session("ReportTitle") = Nothing
            Session("PRINT") = Nothing
            Session("EXCEL") = Nothing

        Catch ex As Exception
            LblErr.Text = ex.Message.ToString
            Panel3.Visible = True

            MyDbAction.DoLogs("Class==Fin_AnalysisRpt.vb: Private Sub ShowReport()" & " : Error : " & ex.Message)
        End Try
    End Sub

    

    Protected Sub Page_Init(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Init
        Try
        

            ShowReport()

            CrystalReportViewer1.ReportSource = Nothing
            rpt.Database.Dispose()
            rpt.Refresh()
            rpt.Close()
            rpt.Dispose()
        Catch ex As Exception
            LblErr.Text = ex.Message
        End Try




    End Sub

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        'ShowReport()
        'ViewReport(Session("Reportname"), "", "")
    End Sub
    Protected Sub Page_Unload(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Unload
        If ViewState("Show_Report") = "True" Then
            CrystalReportViewer1.ReportSource = Nothing
            rpt.Database.Dispose()
            rpt.Close()
            rpt.Dispose()
            ' GC.Collect()
            Session("PRINT") = Nothing
            Session("EXCEL") = Nothing
            Session("Reportname") = Nothing
        Else
            CrystalReportViewer1.ReportSource = Nothing
            rpt.Close()
            rpt.Dispose()
            Session("EXCEL") = Nothing
            Session("Reportname") = Nothing
            Session("PRINT") = Nothing
        End If
    End Sub


    Private Sub ReleaseObject(ByVal o As Object)
        Try
            While (System.Runtime.InteropServices.Marshal.ReleaseComObject(o) > 0)
            End While
        Catch
        Finally
            o = Nothing
        End Try
    End Sub
    Private Sub ExporttoExcel(ByVal table As DataTable, ByVal FileName As String)

        'Export the Columns to excel file

        Dim attachment As String = "attachment; filename=" & FileName & ".xls"
        Response.ClearContent()
        Response.AddHeader("content-disposition", attachment)
        Response.ContentType = "application/vnd.ms-excel"
        Dim tab As String = ""

        For Each dc As DataColumn In table.Columns
            Response.Write(tab + dc.ColumnName)
            tab = vbTab
        Next

        Response.Write(vbLf)

        Dim i As Integer
        For Each dr As DataRow In table.Rows
            tab = ""
            For i = 0 To table.Columns.Count - 1
                Response.Write(tab & dr(i).ToString())
                tab = vbTab
            Next
            Response.Write(vbLf)
        Next
        Response.End()


    End Sub



End Class
