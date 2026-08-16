Imports System.Data
Imports System.Data.OleDb
Imports System.IO
Imports System.Data.SqlClient
Imports System.Web
Imports System.Web.Configuration
Imports DocManage
Imports Telerik.Web.UI

Partial Class logout
    Inherits System.Web.UI.Page

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        'Session("UserName") = Nothing
        'Session.Abandon()


        Try
            'Dim ExportedReports As String = Server.MapPath("GeneratedReports\" & Replace(Session("FullNames"), " ", "_"))
            'Dim MyDir As Array = Directory.GetFiles(ExportedReports)
            'Dim MyDir2 As Array = Directory.GetDirectories(ExportedReports)

            'For i As Integer = 0 To MyDir.Length - 1
            '    File.Delete(MyDir(i).ToString)
            'Next

            'REM Delete any folders created in this location..mostly it will be for reporting purposes
            'For i As Integer = 0 To MyDir2.Length - 1
            '    Directory.Delete(MyDir2(i).ToString)
            'Next

        Catch ex As Exception

        Finally
            ''--B4 killing the session, unflag ActiveSession
            KillActiveSession(Session("MyEmployeeID"))
            Session.Abandon()
            Response.Redirect("Login.aspx")
        End Try
    End Sub
    Private Sub KillActiveSession(ByVal EmployeeID As Integer)
        Dim MySqlAction As String = ""
        Dim MyDBAction As New DataManagement

        Try
            MySqlAction = "UPDATE Employees SET ActiveSession = 0 WHERE EmployeeID = " & EmployeeID & ""
            MyDBAction.DBAction(MySqlAction, DataManagement.DBActionType.Update)

        Catch ex As Exception
            MyDBAction.DoLogs("Class==MasterPage.vb : Private Sub KillActiveSession" & " : Error : " & ex.Message)
        End Try
    End Sub
End Class
