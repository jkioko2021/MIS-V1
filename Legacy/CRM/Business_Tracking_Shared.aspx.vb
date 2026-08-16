Imports System.Data
Imports DocManage.DataManagement

Imports System.Data.SqlClient

Imports Telerik.Web.UI
Imports DocManage
Imports System.IO

Imports System.Data.OleDb
Imports System.Web.Configuration
Imports Mymail
Partial Class _Default
    Inherits System.Web.UI.Page
    Dim MyDBAction As New DataManagement
    Dim MyDatable As New Data.DataTable
    Dim MyQuery As String = ""
    Dim SqlAction As String = ""
    Dim MyDatatable As DataTable : Dim Str As String
    Dim AB As Integer
    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load

        If Not IsPostBack Then
            Try
                Dim unit_code As String = ""
                Dim region_code As String = ""
                HiddenField1.Value = 0
                Session("empcode") = Nothing
                Session("agentemail") = Nothing
                ltEmbed.Text = ""
                lblno.Text = ""
                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE entered_by='" & Session("username") & "' and Forwarded=0 AND Ready_For_update=0 AND Is_Declined=0  AND Is_Active=1 AND Paired=0"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDTracking.DataSource = MyDatable
            GDTracking.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GDTracking.DataSource = Nothing
            GDTracking.DataBind()
        End If
    End Sub
    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T")
        GDTracking.DataBind()
    End Sub
    Public Sub loadGrid(ByVal STR As String)
        Dim MyDatable As New Data.DataTable
        GD_DOCS.DataSource = Nothing
        GD_DOCS.DataBind()

        GD_Paired.DataSource = Nothing
        GD_Paired.DataBind()
        Try

            MyDatable = Nothing
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & FILE_NO.Text & "' AND ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_DOCS.DataSource = MyDatable
                GD_DOCS.DataBind()
                MyDatable = Nothing
            Else
                GD_DOCS.DataSource = Nothing
                GD_DOCS.DataBind()
            End If

         
            SqlAction = "SELECT [File_No],[Proposer_Name], Premium, Client_Type,Pay_Ref_No,Paid_Amt,File_Status  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE [Pay_Ref_No]='" & STR & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_Paired.DataSource = MyDatable
                GD_Paired.DataBind()
                MyDatable = Nothing
            Else
                GD_Paired.DataSource = Nothing
                GD_Paired.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub

    Protected Sub DownloadFile(sender As Object, e As EventArgs)
        ltEmbed.Text = ""
        Dim id As Integer = Integer.Parse(TryCast(sender, LinkButton).CommandArgument)
        Dim embed As String = "<object data=""{0}{1}"" type=""application/pdf"" width=""1000px"" height=""600px"">"
        embed += "If you are unable to view file, you can download from <a href = ""{0}{1}&download=1"">here</a>"
        embed += " or download <a target = ""_blank"" href = ""{0}{1}&download=1"">Adobe PDF Reader</a> to view the file."
        embed += "</object>"
        ltEmbed.Text = String.Format(embed, ResolveUrl("~/FileDoc.ashx?Id="), id)
    End Sub


    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            HiddenField1.Value = 1
            ltEmbed.Text = ""
            GD_Paired.DataSource = Nothing
            GD_Paired.DataBind()

            Dim PAIR As String = ""
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT Pay_Ref_No,[File_No],entered_By,Allocated_to,eOx_Invoice_No,Pay_Ref_No   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "' AND Is_Active=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                PAIR = MyDatable.Rows(0).Item("Pay_Ref_No").ToString()
                loadGrid(PAIR)

            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Protected Sub ToggleRowSelection(ByVal sender As Object, ByVal e As EventArgs)
        Dim Total As Decimal

        TryCast(TryCast(sender, CheckBox).NamingContainer, GridItem).Selected = TryCast(sender, CheckBox).Checked
        Dim checkHeader As Boolean = True
        For Each dataItem As GridDataItem In GD_Pay.MasterTableView.Items
            If Not TryCast(dataItem.FindControl("chkreturn"), CheckBox).Checked Then
                checkHeader = False

                Exit For
            End If

        Next
        Dim headerItem As GridHeaderItem = TryCast(GD_Pay.MasterTableView.GetItems(GridItemType.Header)(0), GridHeaderItem)
        TryCast(headerItem.FindControl("chkheader"), CheckBox).Checked = checkHeader

    End Sub

    Protected Sub ToggleSelectedState(ByVal sender As Object, ByVal e As EventArgs)
        Dim headerCheckBox As CheckBox = TryCast(sender, CheckBox)

        For Each dataItem As GridDataItem In GD_Pay.MasterTableView.Items
            TryCast(dataItem.FindControl("chkreturn"), CheckBox).Checked = headerCheckBox.Checked
            dataItem.Selected = headerCheckBox.Checked

        Next
    End Sub
    Private Sub DeleteRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)

        'ShowGridDetails()
    End Sub
    Protected Sub GD_Pay_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GD_Pay.DeleteCommand


        Try

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("File_No").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim File_No As String = ""
            Dim Proposer_Name As String = ""
            Dim audit As New DataManagement
            UpdateRecord("UPDATE  [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] SET Pay_Ref_No='" & HiddenField1.Value.ToString & "', [Shared_pay]=0 , Paired=0  WHERE File_No='" & HiddenField1.Value.ToString & "'")
            'DeleteRecord("DELETE FROM TBL_MIS_CRM_DOCS WHERE  File_No='" & HiddenField1.Value.ToString & "'")
            SqlAction = "SELECT [File_No],[Proposer_Name], Premium, Client_Type,Pay_Ref_No,Paid_Amt,File_Status  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE [Shared_pay]=1 and Paired=0  AND Is_Active=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_Pay.DataSource = MyDatable
                GD_Pay.DataBind()
                MyDatable = Nothing
            Else
                GD_Pay.DataSource = Nothing
                GD_Pay.DataBind()
            End If
            'ResetDisplayed("NewRecord")
            lblerr.Text = "Record updated!"
            'CmdSave.Enabled = False
        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub
    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try

            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Business  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Is_Active=1 "
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Business  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Is_Active=1 "
            Else
                Exit Sub
            End If

            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDTracking.DataSource = MyDatable
                GDTracking.DataBind()
                'Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GDTracking.DataSource = Nothing
                GDTracking.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


    Protected Sub btnadd_Click(sender As Object, e As System.EventArgs) Handles btnadd.Click
        Try
            GD_Pay.DataSource = Nothing
            GD_Pay.DataBind()
            UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET [Shared_pay]=1,Paired=0  WHERE [File_no]='" & Trim(FILE_NO.Text) & "'")

            SqlAction = "SELECT [File_No],[Proposer_Name], Premium, Client_Type,Pay_Ref_No,Paid_Amt,File_Status  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE [Shared_pay]=1 and Paired=0  AND Is_Active=1 AND File_Status IN ('REGISTERED','FORWARDED','ALLOCATED','RETURNED-INCOMPLETE','RECEIPTED')"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_Pay.DataSource = MyDatable
                GD_Pay.DataBind()
                MyDatable = Nothing
            Else
                GD_Pay.DataSource = Nothing
                GD_Pay.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Function xrand() As Long
        Dim r1 As Long = Now.Day & Now.Month & Now.Year & Now.Hour & Now.Minute & Now.Second & Now.Millisecond
        Dim RAND As Long = Math.Max(r1, r1 * 2)
        Return RAND
    End Function


    Public Sub Generate_REF()
        SqlAction = "SELECT ISNULL((MAX(Id)+1),1) NUMBER FROM [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING]"
        MyDatatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatatable.Rows.Count > 0 Then
            AB = MyDatatable.Rows(0).Item("NUMBER").ToString()
            Dim numStr4ch As String = Strings.Right("0000" & AB.ToString(), 4)
            lblno.Text = "REF-" & Now.Minute & Now.Second & Now.Second & "/-" + numStr4ch + ""
        End If
    End Sub
    Protected Sub btngen_Click(sender As Object, e As System.EventArgs) Handles btngen.Click
        Try
            GD_Paired.DataSource = Nothing
            GD_Paired.DataBind()
            Generate_REF()

            For Each dataItem As GridDataItem In GD_Pay.MasterTableView.Items
                Dim chkSelect As CheckBox = DirectCast(dataItem.FindControl("chkreturn"), CheckBox)

                If chkSelect.Checked Then
                    Dim ID As String = dataItem.GetDataKeyValue("File_No").ToString()
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET [Shared_pay]=1,Paired=1,Pay_Ref_No='" & lblno.Text & "'  WHERE [File_no]='" & Trim(ID) & "'")
                    If txtcomment.Text <> "" Then
                        MyDBAction.TRACKING_MESSAGES(ID, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
                    End If
                End If

            Next
            lblerr.Text = "Records updated successfully"
            SqlAction = "SELECT [File_No],[Proposer_Name], Premium, Client_Type,Pay_Ref_No,Paid_Amt,File_Status  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE [Pay_Ref_No]='" & lblno.Text & "'  AND Is_Active=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_Paired.DataSource = MyDatable
                GD_Paired.DataBind()
                MyDatable = Nothing
            Else
                GD_Paired.DataSource = Nothing
                GD_Paired.DataBind()
            End If
            GD_Pay.DataSource = Nothing
            GD_Pay.DataBind()
            lblno.Text = ""

        Catch ex As Exception

        End Try
    End Sub
End Class
