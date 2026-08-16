Imports System.Data
Imports System.Data.OleDb
Imports System.Data.SqlClient
Imports System.Drawing
Imports System.IO
Imports System.Web.Configuration
Imports DocManage
Imports DocManage.DataManagement
Imports Mymail
Imports NPOI.Util
Imports Telerik.Web.UI
Partial Class _Default
	Inherits System.Web.UI.Page
	Dim MyDBAction As New DataManagement
	Dim MyDatable As New Data.DataTable
	Dim MyQuery As String = ""
	Dim SqlAction As String = ""
	Dim MyDatatable As DataTable : Dim Str As String
	Dim audit As New DataManagement
	Dim AB As Integer
	Dim MailSent As Boolean = False
	Dim email As New Mail
	Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load
		If Not Me.IsPostBack Then
			Try
				Me.dtreceivedate.DbSelectedDate = DateTime.Now
				Me.dtreceivedate.Enabled = False
				Me.cboAllocate.SelectedValue = ""
				Me.cboAllocate.Text = ""
				Me.cboAllocate.Enabled = True
				Me.GDTracking.DataSource = Nothing
				Me.GDTracking.DataBind()
				Me.HiddenField1.Value = 0
				Me.Session("empcode") = Nothing
				Me.Session("agentemail") = Nothing
				Me.Session("med") = 0
				Me.Session("Allocate") = 0
				Me.Session("INVOICED") = 0

				Me.Str = "SELECT COUNTY_CODE,COUNTY_NAME from [dbo].[TBL_MIS_COUNTY]"
				Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
				With cboCounty
					cboCounty.Items.Clear()
					cboCounty.DataSource = Me.MyDatatable
					cboCounty.DataTextField = Me.MyDatatable.Columns("COUNTY_NAME").ToString()
					cboCounty.DataValueField = Me.MyDatatable.Columns("COUNTY_CODE").ToString()
					cboCounty.DataBind()
				End With
				Me.Str = "SELECT  [DOC_CODE],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] WHERE ACTIVE=1 and code not in (5,3) and CLIENT='R'"
				Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
				Dim cbodocs As RadComboBox = Me.cbodocs
				cbodocs.Items.Clear()
				cbodocs.DataSource = Me.MyDatatable
				cbodocs.DataTextField = Me.MyDatatable.Columns("DOC_NAME").ToString()
				cbodocs.DataValueField = Me.MyDatatable.Columns("DOC_CODE").ToString()
				cbodocs.DataBind()

				Me.Str = "SELECT USER_ID,AGENT_NAME FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] where ACTIVE=1  ORDER BY AGENT_NAME"
				Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
				Dim cboagent As RadComboBox = Me.cboagent
				cboagent.Items.Clear()
				cboagent.DataSource = Me.MyDatatable
				cboagent.DataTextField = Me.MyDatatable.Columns("AGENT_NAME").ToString()
				cboagent.DataValueField = Me.MyDatatable.Columns("USER_ID").ToString()
				cboagent.DataBind()

				Me.Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  approved=1 AND Deleted=0 AND Department IN ('MEMBERSHIP')"
				Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
				Dim cboAllocate As RadComboBox = Me.cboAllocate
				cboAllocate.Items.Clear()
				cboAllocate.DataSource = Me.MyDatatable
				cboAllocate.DataTextField = Me.MyDatatable.Columns("EmployeeName").ToString()
				cboAllocate.DataValueField = Me.MyDatatable.Columns("username").ToString()
				cboAllocate.DataBind()
				cboAllocate.SelectedValue = ""



				Me.loadGrid_N()
			Catch ex As Exception
				Me.lblerr.Text = ex.Message
			End Try
		End If
	End Sub

	'Protected Sub cboBusiness_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboBusiness.SelectedIndexChanged
	'    Try
	'        'ltEmbed.Text = ""
	'        If cboclient.SelectedValue = "R" Then
	'            chklist.Items.Clear()
	'            If cboBusiness.SelectedValue = "N" Then
	'                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where  [BUSINESS_TYPE] <>'R' AND CLIENT='R'"
	'                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
	'                With chklist
	'                    .Items.Clear()
	'                    .DataSource = MyDatatable
	'                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
	'                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
	'                    .DataBind()
	'                End With
	'            ElseIf cboBusiness.SelectedValue = "R" Then
	'                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where  [BUSINESS_TYPE] <>'N' AND CLIENT='R'"
	'                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
	'                With chklist
	'                    .Items.Clear()
	'                    .DataSource = MyDatatable
	'                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
	'                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
	'                    .DataBind()
	'                End With
	'            End If
	'        Else
	'            chklist.Items.Clear()
	'            If cboBusiness.SelectedValue = "N" Then
	'                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where  [BUSINESS_TYPE] <>'R' AND CLIENT='C'"
	'                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
	'                With chklist
	'                    .Items.Clear()
	'                    .DataSource = MyDatatable
	'                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
	'                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
	'                    .DataBind()
	'                End With
	'            ElseIf cboBusiness.SelectedValue = "R" Then
	'                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where  [BUSINESS_TYPE] <>'N' AND CLIENT='C'"
	'                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
	'                With chklist
	'                    .Items.Clear()
	'                    .DataSource = MyDatatable
	'                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
	'                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
	'                    .DataBind()
	'                End With
	'            End If
	'        End If

	'    Catch ex As Exception
	'        lblerr.Text = ex.Message
	'    End Try
	'End Sub

	Protected Sub GDTracking_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GDTracking.DeleteCommand


		Try

			Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
			HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("File_No").ToString()

			Dim MySqlAction As String = ""
			Dim MyDBAction As New DataManagement
			Dim MyDataTable As New Data.DataTable
			Dim File_No As String = ""
			Dim Proposer_Name As String = ""

			UpdateRecord("UPDATE  [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] SET Is_Active=0  WHERE File_No='" & HiddenField1.Value.ToString & "' AND FILE_STATUS IN ('REGISTERED','FORWARDED','RETURNED-INCOMPLETE')")
			'DeleteRecord("DELETE FROM TBL_MIS_CRM_DOCS WHERE  File_No='" & HiddenField1.Value.ToString & "'")

			audit.AddAdminAuditTrail(Session("UserName").ToString, "Business Tracking Delete", "Deleted Record :-   :" & HiddenField1.Value & " date:" & Date.Now() & ", Name - " & Session("FullNames") & ".",
		   Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
			HiddenField1.Value = 0
			HiddenField1.Value = 0

			'ResetDisplayed("NewRecord")
			lblerr.Text = "Record Deleted!"
			'CmdSave.Enabled = False

			loadGrid_N()

		Catch ex As Exception


			Dim ErrMsg As String = ex.Message
		End Try
	End Sub
	Protected Sub GD_DOCS_DeleteCommand(sender As Object, e As GridCommandEventArgs) Handles GD_DOCS.DeleteCommand
		Try
			Me.HiddenField1.Value = ""
			Dim gridDataItem As GridDataItem = CType(e.Item, GridDataItem)
			Me.HiddenField1.Value = gridDataItem.OwnerTableView.DataKeyValues(gridDataItem.ItemIndex)("DOC_ID").ToString()
			Dim dataManagement As DataManagement = New DataManagement()
			Dim dataTable As DataTable = New DataTable()
			Dim dataManagement2 As DataManagement = New DataManagement()
			DeleteRecord("DELETE FROM [Doc_Arc_DB].dbo.TBL_MIS_CRM_DOCS WHERE  DOC_ID='" + Me.HiddenField1.Value.ToString() + "'")
			audit.AddAdminAuditTrail(Session("UserName").ToString, "Business Tracking Delete", "Deleted Record :-   :" & HiddenField1.Value & " date:" & Date.Now() & ", Name - " & Session("FullNames") & ".",
		   Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
			HiddenField1.Value = ""
			Me.HiddenField1.Value = ""
			Me.lblerr.Text = "Record Deleted!"
			Me.loadGrid_N()
		Catch ex As Exception
			Dim message As String = ex.Message
		End Try
	End Sub

	Private Sub DeleteRecord(ByVal sqlAction As String)
		Dim MySmsObject As New DataManagement
		MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)

		'ShowGridDetails()
	End Sub

	Protected Sub btnsave_Click(sender As Object, e As EventArgs) Handles btnsave.Click
		Try
			Dim num As Integer = 0
			Dim text As String = "N"
			Me.lblSave.Text = ""
			Dim num2 As Integer = 0
			If Me.chkassembly.Checked Then
				num2 = 1
			End If
			'


			If Me.chkwalkin.Checked = True Then
				Str = "SELECT EMP_CODE FROM CRM.dbo.employees WHERE username='" & Session("username") & "' AND DEPARTMENT='CUSTOMER SERVICE' AND DELETED=0 AND ACTIVATED=1" '"
				MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
				If MyDatatable.Rows.Count > 0 Then
					text = "Y"

				Else
					lblSave.Text = "This can only be actioned by Customer Executive officer"
					Exit Sub
				End If

			End If
			If Me.cboBusiness.SelectedValue = "" Then
				Me.lblSave.Text = "Select The Business Type"
				Exit Sub

			ElseIf Me.cboclient.SelectedValue = "" Then
				Me.lblSave.Text = "Select The Client Type"
				Exit Sub

			ElseIf Me.cboagent.SelectedValue = "" Then
				Me.lblSave.Text = "Select The Agent"
				Exit Sub

			ElseIf Me.txtProposer.Text = "" Then
				Me.lblSave.Text = "Enter the Proposer Name"
				Exit Sub

			ElseIf Me.cboBUS.SelectedValue = "" Then
				Me.lblSave.Text = "Select The Business"
				Exit Sub

			ElseIf Me.cboBusiness.SelectedValue = "N" Then
				If Me.txtNID.Text = "" Then
					Me.lblSave.Text = "Enter the ID NO"
					Exit Sub
				End If
				If Me.cboCounty.SelectedValue = "" Then
					Me.lblSave.Text = "Select The County"
					Exit Sub
				End If
				If Me.txt_PIN.Text = "" Then
					Me.lblSave.Text = "Enter The Pin Number"
					Exit Sub
				End If
			End If
			If Me.chkwalkin.Checked = True And cboAllocate.SelectedValue = "" Then
				Me.lblSave.Text = "Select Membership Admin"
				Exit Sub
			End If
			If Me.chkwalkin.Checked = False Then
				cboAllocate.SelectedValue = ""
				Exit Sub
			End If
			If Me.cboBUS.SelectedValue = "N" And cboGI_Cat.SelectedValue = "" Then
				Me.lblSave.Text = "Select GI Category"
				cboGI_Cat.Focus()
				Exit Sub
			End If

			If HiddenField1.Value = 0 Then
						Me.Generate_Task()
				Me.MyDBAction.Business_Tracking_1(Me.FILE_NO.Text, Me.cboBusiness.SelectedValue, Me.cboclient.SelectedValue, Me.txtProposer.Text, "", Me.cboagent.SelectedValue, 0.0, Me.cboCard.SelectedValue, DateTime.Now.ToString("yyyy-MM-dd hh:mm"), num2, Me.HiddenField1.Value, Me.Session("UserName").ToString(), Me.cboBUS.SelectedValue, HiddenField1.Value, "", 0, text, Me.cboAllocate.SelectedValue, "S", num, Strings.Trim(Me.FILE_NO.Text).ToUpper(), Me.txtpaid.Text, Me.txtNID.Text, Me.txt_PIN.Text, Me.cboPayment.SelectedValue, Me.cboCounty.SelectedValue, "", "", "", cboGI_Cat.SelectedValue)
			Else
				Me.MyDBAction.Business_Tracking_1(Me.FILE_NO.Text, Me.cboBusiness.SelectedValue, Me.cboclient.SelectedValue, Me.txtProposer.Text, "", Me.cboagent.SelectedValue, 0.0, Me.cboCard.SelectedValue, DateTime.Now.ToString("yyyy-MM-dd hh:mm"), num2, HiddenField1.Value, Me.Session("UserName").ToString(), Me.cboBUS.SelectedValue, Me.HiddenField1.Value, "", 0, text, Me.cboAllocate.SelectedValue, "S", num, Strings.Trim(Me.FILE_NO.Text).ToUpper(), Me.txtpaid.Text, Me.txtNID.Text, Me.txt_PIN.Text, Me.cboPayment.SelectedValue, Me.cboCounty.SelectedValue, "", "", "", cboGI_Cat.SelectedValue)
			End If
					Me.lblSave.Text = "Saved Successfully!"
					Me.loadGrid_N()
					Me.FILE_NO.Text = ""
					Me.cboBusiness.SelectedValue = ""
					Me.cboclient.SelectedValue = ""
					Me.txtProposer.Text = ""
					Me.cboCard.SelectedValue = ""
					Me.cboBUS.SelectedValue = ""
					Me.txtpaid.Text = 0
					Me.txtNID.Text = ""
					Me.txt_PIN.Text = ""
					Me.cboPayment.SelectedValue = ""
					Me.txtcomment.Text = ""
					Me.HiddenField1.Value = 0
					Me.chkwalkin.Checked = False
					Me.txtProposer.Text = ""
					Me.cboBusiness.Text = ""
					Me.cboclient.Text = ""
					Me.chkassembly.Checked = False
					Me.cboAllocate.Text = ""
			Me.cboAllocate.SelectedValue = ""
			Me.cboAllocate.Enabled = True
			Me.cboBusiness.Text = ""
					Me.cboclient.Text = ""


		Catch ex As Exception
			Me.lblerr.Text = ex.Message
		End Try
	End Sub
	Public Sub loadGrid_N()
		Me.SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE entered_by='" & Me.Session("username") & "' and Forwarded=0 AND Ready_For_update=0 AND Is_Declined=0  AND Is_Active=1 AND Client_Type='R'"
		Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
		If Me.MyDatable.Rows.Count > 0 Then
			Me.GDTracking.DataSource = Me.MyDatable
			Me.GDTracking.DataBind()
			Me.Session("DAD_T") = Me.MyDatable
			Me.MyDatable = Nothing
		Else
			Me.GDTracking.DataSource = Nothing
			Me.GDTracking.DataBind()
		End If
	End Sub

	' Token: 0x0600008F RID: 143 RVA: 0x00003C34 File Offset: 0x00001E34
	Public Sub loadGrid(STR As String)
		Dim dataTable As DataTable = New DataTable()
		Try
			Me.SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" + STR + "' AND ACTIVE=1 ORDER BY DOC_ID ASC"
			dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
			If dataTable.Rows.Count > 0 Then
				Me.GD_DOCS.DataSource = dataTable
				Me.GD_DOCS.DataBind()
			Else
				Me.GD_DOCS.DataSource = dataTable
				Me.GD_DOCS.DataBind()
			End If
			Me.SqlAction = "SELECT [Note_id],[File_No],[Note_From] ,[Note_date],[Notes]  FROM [CRM].[dbo].[TBL_MIS_CRM_BUS_TRACKING_NOTES] WHERE  File_No ='" + STR + "'  AND ACTIVE=1 ORDER BY Note_id DESC"
			dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
			If dataTable.Rows.Count > 0 Then
				Me.GDNOTES.DataSource = dataTable
				Me.GDNOTES.DataBind()
			Else
				Me.GDNOTES.DataSource = dataTable
				Me.GDNOTES.DataBind()
			End If
			Me.SqlAction = "SELECT [Note_id],[File_No],[Note_From] ,[Note_date],[Notes]  FROM [CRM].[dbo].[TBL_MIS_CRM_BUS_TRACKING_NOTES] WHERE  File_No ='" + STR + "'  AND ACTIVE=1 ORDER BY Note_id DESC"
			dataTable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
			If dataTable.Rows.Count > 0 Then
				Me.GDNOTES.DataSource = dataTable
				Me.GDNOTES.DataBind()
			Else
				Me.GDNOTES.DataSource = dataTable
				Me.GDNOTES.DataBind()
			End If
		Catch ex As Exception
			Me.lblerr.Text = ex.Message
		End Try
	End Sub

	' Token: 0x06000090 RID: 144 RVA: 0x00003DE4 File Offset: 0x00001FE4
	Protected Sub btnforward_Click(sender As Object, e As EventArgs) Handles btnforward.Click
		Try
			If Not Me.chkassembly.Checked Then
				Me.lblerr.Text = "You Must Tick Business is complete Checkbox!"
			ElseIf FILE_NO.Text = "" Then
				Me.lblerr.Text = "Select the File!"
			ElseIf Me.txtcomment.Text = "" Then
				Me.lblerr.Text = "You Must capture basic Comments!"
			Else
				Me.SqlAction = "SELECT  File_Name FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE File_No='" + Me.FILE_NO.Text + "' AND ACTIVE=1 AND Upload_Done=0"
				Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
				If Me.MyDatatable.Rows.Count > 0 Then
					Me.btnsave.Enabled = True
					Me.lblerr.Text = "You must upload the Missing Documents!"
				Else

					If Session("med") = 1 And Session("Allocate") = 0 Then
						UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1,[Ready_For_update]=0, File_Status='MEDICAL UW-REVIEW' where [File_No]= '" & FILE_NO.Text & "'")

					ElseIf Session("Allocate") = 1 And Session("Benefit_Verified") = "NO" Then
						UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1,Allocated=1,[Ready_For_update]=1, File_Status='BENEFIT VERIFICATION' where [File_No]= '" & FILE_NO.Text & "'")
					ElseIf Session("Allocate") = 1 And Session("Benefit_Verified") = "YES" And Session("INVOICED") = 0 Then
						UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1,Allocated=1,[Ready_For_update]=1, File_Status='ALLOCATED' where [File_No]= '" & FILE_NO.Text & "'")

					ElseIf Session("INVOICED") = 1 Then
						UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1,Allocated=1,[Ready_For_update]=1, File_Status='INVOICED' where [File_No]= '" & FILE_NO.Text & "'")
					Else
						If chkwalkin.Checked = True Then
							UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Forward_Date]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',[Is_Complete]=1,Allocated=1,[Ready_For_update]=1, File_Status='ALLOCATED',Allocated_To='" & cboAllocate.SelectedValue & "',Benefit_Verified='YES', [Walk_In_Client]='Y',[Allocate_Dt]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "' where [File_No]= '" & FILE_NO.Text & "'")
						Else
							UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Allocated=0, Forwarded=1,[Is_Complete]=1 ,Forwarded_By='" & Session("username") & "' ,[Ready_For_update]=1, [Forward_Date]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm:ss tt") & "',File_Status='FORWARDED' where [File_No]= '" & FILE_NO.Text & "'")
						End If
					End If
					If txtcomment.Text <> "" Then
						MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd hh:mm:ss tt"), txtcomment.Text)
					End If
					Me.Session("to") = "Team"
					If Me.chkwalkin.Checked = True And Me.cboBUS.SelectedValue = "M" And Me.cboBusiness.SelectedValue <> "N" Then
						Me.UpdateRecord("UPDATE CRM.[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1 ,Allocated=1,Forwarded_By='" & Me.Session("username") & "' ,[Ready_For_update]=1, [Forward_Date]='" & DateTime.Now.ToString("yyyy-MM-dd hh:mm") & "',File_Status='ALLOCATED',BENEFIT_VERIFIED='YES' where [File_No]= '" & Me.FILE_NO.Text & "'")
						Me.Str = "SELECT EMAIL FROM employees WHERE username='" + Me.cboAllocate.SelectedValue + "'"
						Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
						If Me.MyDatatable.Rows.Count > 0 Then
							Me.Session("to") = Me.cboAllocate.Text
							Me.Session("email") = Me.MyDatatable.Rows(0)("EMAIL").ToString()
							'Me.Session("email") = "mwaniki56@gmail.com"
							Me.Session("Header") = "Walk-in Client-" + Me.txtProposer.Text
							Me.Session("msg") = "Kindly note that you  have been Allocated the below Business for a Walk-In Client by Customer Service Desk for update.TREAT THIS AS AGENT!"
							Me.MailSent = Me.SendLoginDetails(Me.Session("to"), Me.Session("email"), Session("email"))
						End If
					Else
						If cboBUS.SelectedValue = "M" And Session("med") <> 1 Then

							'Session("email") = "computer-]@aar.co.ke"
							'Session("Header") = "Registered-" & txtProposer.Text
							'Session("msg") = "Kindly note that the above client has been Tracked and forwarded to Membership for update!"
						ElseIf cboBUS.SelectedValue = "N" Then
							'UpdateRecord("UPDATE CRM.[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1 ,Allocated=0,Forwarded_By='" & Session("username") & "' ,[Ready_For_update]=1, [Forward_Date]='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',File_Status='FORWARDED' where [File_No]= '" & FILE_NO.Text & "'")
							'Me.Session("email") = "mwaniki56@gmail.com"
							Session("email") = "nonmedical@aar.co.ke"
							Session("Header") = "Registered-" & txtProposer.Text
							Session("msg") = "Kindly note that the above client has been Tracked and forwarded to Non-Medical Team for update!"
							MailSent = SendLoginDetails("Team", Session("email"), Session("email"))
						End If
					End If
					Me.lblerr.Text = "Forwarded successfully!"
					Me.loadGrid_N()
					Me.txtcomment.Text = ""
					Me.Session("INVOICED") = 0
					Me.Session("Allocate") = 0
					Me.Session("med") = 0
					Me.HiddenField1.Value = 0
					Me.txtProposer.Enabled = True
					Me.dtreceivedate.Enabled = True
					Me.cboCard.Enabled = True
					Me.cboBusiness.Enabled = True
					Me.cboclient.Enabled = True
					Me.btnsave.Enabled = True
					Me.txt_PIN.Enabled = True
					Me.txtNID.Enabled = True
					Me.chkwalkin.Enabled = True
					cboAllocate.Enabled = True
					Me.txtProposer.Text = ""
					Me.FILE_NO.Text = ""
					Me.chkwalkin.Checked = False
					Me.lblSave.Text = ""
					Me.dtreceivedate.DbSelectedDate = DateTime.Now
					Me.cboCard.Text = ""
					Me.cboBusiness.SelectedValue = ""
					Me.cboclient.SelectedValue = ""
					Me.txt_PIN.Text = ""
					Me.txtNID.Text = ""
					Me.txtpaid.Text = 0
					Me.GD_DOCS.DataSource = Nothing
					Me.GD_DOCS.DataBind()
					Me.GDNOTES.DataSource = Nothing
					Me.GDNOTES.DataBind()
				End If
			End If
		Catch ex As Exception
			Me.lblerr.Text = ex.Message
		End Try
	End Sub

	Private Sub UpdateRecord(sqlAction As String)
		Dim dataManagement As DataManagement = New DataManagement()
		dataManagement.DBAction(sqlAction, DataManagement.DBActionType.Update, "", Nothing)
	End Sub

	' Token: 0x06000092 RID: 146 RVA: 0x000046FC File Offset: 0x000028FC
	Protected Sub btnupload_Click(sender As Object, e As EventArgs) Handles btnupload.Click
		Dim dataTable As DataTable = New DataTable()
		Try
			If Me.FL1.PostedFile.FileName = "" Then
				Me.lblerr.Text = "You must upload a reference pdf file!"
			ElseIf Me.cbodocs.SelectedValue = "" Then
				Me.lblerr.Text = "You must Select Document Name!"
			ElseIf Me.FILE_NO.Text = "" Then
				Me.lblerr.Text = "You must Select File Number!"
			Else

				Dim filePath As String = FL1.PostedFile.FileName
				Dim filename As String = Path.GetFileName(filePath)
				Dim ext As String = Path.GetExtension(filename)
				Dim contenttype As String = String.Empty
				Dim fs As Stream = FL1.PostedFile.InputStream
				Dim br As New BinaryReader(fs)
				Dim bytes As Byte() = br.ReadBytes(DirectCast(fs.Length, Long))

				Dim app As Integer = 0

				Select Case ext
					Case ".doc"
						contenttype = "application/vnd.ms-word"
						Exit Select
					Case ".docx"
						contenttype = "application/vnd.ms-word"
						Exit Select
					Case ".xls"
						contenttype = "application/vnd.ms-excel"
						Exit Select
					Case ".xlsx"
						contenttype = "application/vnd.ms-excel"
						Exit Select
					Case ".jpg"
						contenttype = "image/jpg"
						Exit Select
					Case ".png"
						contenttype = "image/png"
						Exit Select
					Case ".gif"
						contenttype = "image/gif"
						Exit Select
					Case ".jpeg"
						contenttype = "image/jpeg"
						Exit Select
					Case ".pdf"
						contenttype = "application/pdf"
						Exit Select
					Case ".rar"
						contenttype = "application/zip"
						Exit Select
					Case ".zip"
						contenttype = "application/zip"
					Case ".eml"
						contenttype = "application/zip"
						Exit Select
					Case ".msg"
						contenttype = "application/zip"
						Exit Select
				End Select
				If contenttype <> String.Empty Then
					Dim fileLocation As String = ""
					Me.MyDBAction.UPLOAD_ITEMS_1(Me.FILE_NO.Text, Me.cbodocs.SelectedValue, Me.cbodocs.Text, DateTime.Now.ToString("yyyy-MM-dd"), Me.Session("username"), bytes, filename, contenttype)
					Me.lblupload.ForeColor = Color.Green
					Me.lblupload.Text = "File Uploaded Successfully"
				Else
					Me.lblupload.Text = "File format not recognised. Upload Image/Word/PDF/Excel formats"
				End If
				Me.loadGrid(Me.FILE_NO.Text)
			End If
		Catch ex As Exception
			Me.lblerr.Text = ex.Message
		End Try
	End Sub

	' Token: 0x06000093 RID: 147 RVA: 0x00004A80 File Offset: 0x00002C80
	Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As EventArgs) Handles GDTracking.SelectedIndexChanged
		Try
			Me.FILE_NO.Text = ""
			Me.lblerr.Text = ""
			Me.lblSave.Text = ""
			Me.HiddenField1.Value = 1
			Me.ID = CType(Me.GDTracking.SelectedItems(0), GridDataItem).GetDataKeyValue("File_No").ToString()
			Me.SqlAction = "SELECT [File_No],[Proposer_Name],[Family_code],Premium,File_Status,Business_Type,Business,Pay_Ref_No,Paid_Amt, Receive_dt,Client_Type,PAY_MODE,CARD_TYPE,Is_Complete,Agent_id,Medical_UW,Allocated,INVOICED,Walk_In_Client,Allocated_to,Rate_Type, Benefit_Verified,NID,PIN_NO,County_Code    FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & Me.ID & "'"
			Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
			If Me.MyDatable.Rows.Count > 0 Then
				Me.FILE_NO.Text = Me.MyDatable.Rows(0)("File_No").ToString()
				Me.txtProposer.Text = Me.MyDatable.Rows(0)("Proposer_Name").ToString()
				Me.cboBusiness.SelectedValue = Me.MyDatable.Rows(0)("Business_Type").ToString()
				Me.cboclient.SelectedValue = Me.MyDatable.Rows(0)("Client_Type").ToString()
				Me.chkassembly.Checked = Me.MyDatable.Rows(0)("Is_Complete").ToString()
				Me.cboagent.SelectedValue = Me.MyDatable.Rows(0)("Agent_id").ToString()
				Me.cboBUS.SelectedValue = Me.MyDatable.Rows(0)("Business").ToString()
				Dim text As String = Me.MyDatable.Rows(0)("Walk_In_Client").ToString()
				Me.cboAllocate.SelectedValue = Me.MyDatable.Rows(0)("Allocated_to").ToString()
				Me.Session("med") = Me.MyDatable.Rows(0)("Medical_UW").ToString()
				Me.Session("Allocate") = Me.MyDatable.Rows(0)("Allocated").ToString()
				Me.Session("INVOICED") = Me.MyDatable.Rows(0)("INVOICED").ToString()
				Me.Session("Benefit_Verified") = Me.MyDatable.Rows(0)("Benefit_Verified").ToString()
				Me.txtpaid.Text = Me.MyDatable.Rows(0)("Paid_Amt").ToString()
				Me.txtNID.Text = Me.MyDatable.Rows(0)("NID").ToString()
				Me.txt_PIN.Text = Me.MyDatable.Rows(0)("PIN_NO").ToString()
				Me.cboPayment.SelectedValue = Me.MyDatable.Rows(0)("PAY_MODE").ToString()
				Me.cboCounty.SelectedValue = Me.MyDatable.Rows(0)("County_Code").ToString()
				Me.cboCard.SelectedValue = Me.MyDatable.Rows(0)("CARD_TYPE").ToString()
				text = Me.MyDatable.Rows(0)("Walk_In_Client").ToString()
				If text = "Y" Then
					Me.chkwalkin.Checked = True
				Else
					Me.chkwalkin.Checked = False
				End If
				Me.loadGrid(Me.FILE_NO.Text)
			End If
			Me.chkwalkin.Enabled = False
			Me.btnsave.Enabled = False
			Me.txtProposer.Enabled = False
			Me.cboAllocate.Enabled = True
			Me.cboBusiness.Enabled = False
			Me.cboclient.Enabled = False
		Catch ex As Exception
			Me.lblerr.Text = ex.Message
		End Try
	End Sub

	Public Sub Generate_Task()
		SqlAction = "SELECT ISNULL((MAX(Id)+1),1) NUMBER FROM [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING]"
		MyDatatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
		If MyDatatable.Rows.Count > 0 Then
			AB = MyDatatable.Rows(0).Item("NUMBER").ToString()
			Dim numStr4ch As String = Strings.Right("00000" & AB.ToString(), 6)
			FILE_NO.Text = cboclient.SelectedValue & "-" & Month(Date.Now()) & "/" & Right(Year(Date.Now()), 2) & "/-" + numStr4ch + ""
			Session("Ref_NO") = "REF" & "-" & Month(Date.Now()) & "/" & Right(Year(Date.Now()), 2) & "/-" + numStr4ch + ""
		End If
	End Sub

	' Token: 0x06000095 RID: 149 RVA: 0x000050EC File Offset: 0x000032EC
	Protected Sub btnedit_Click(sender As Object, e As EventArgs) Handles btnedit.Click
		Me.HiddenField1.Value = 1
		If Me.chkwalkin.Checked Then
			Me.cboAllocate.Enabled = True
		End If
		Me.txtProposer.Enabled = True
		Me.chkwalkin.Enabled = True
		Me.dtreceivedate.Enabled = True
		Me.cboCard.Enabled = True
		Me.cboBusiness.Enabled = True
		Me.cboclient.Enabled = True
		Me.btnsave.Enabled = True
		Me.txt_PIN.Enabled = True
		Me.txtNID.Enabled = True
	End Sub

	' Token: 0x06000096 RID: 150 RVA: 0x00005190 File Offset: 0x00003390
	Protected Sub GD_DOCS_SelectedIndexChanged(sender As Object, e As EventArgs) Handles GD_DOCS.SelectedIndexChanged
		Try
			Me.HiddenField1.Value = 0
			Dim text As String = CType(Me.GD_DOCS.SelectedItems(0), GridDataItem).GetDataKeyValue("DOC_ID").ToString()
			Me.SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM  [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  DOC_ID ='" + text + "' AND ACTIVE=1"
			Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
			If Me.MyDatable.Rows.Count > 0 Then
				Me.cbodocs.SelectedValue = Me.MyDatable.Rows(0)("DOC_ID").ToString()
			End If
		Catch ex As Exception
			Me.lblerr.Text = ex.Message
		End Try
	End Sub

	' Token: 0x06000097 RID: 151 RVA: 0x00005284 File Offset: 0x00003484
	Protected Sub btnsearch_Click(sender As Object, e As EventArgs) Handles btnsearch.Click
		Try
			If Me.cbosearch.SelectedValue = "F" Then
				Me.SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Strings.Trim(Me.txtsearch.Text.ToUpper()) & "%' AND Is_Declined=0 AND Ready_For_update=0  AND Is_Active=1"
			ElseIf Me.cbosearch.SelectedValue = "P" Then
				Me.SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Strings.Trim(Me.txtsearch.Text.ToUpper()) & "%' AND Is_Declined=0 AND Ready_For_update=0  AND Is_Active=1"
			End If
			Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
			If Me.MyDatable.Rows.Count > 0 Then
				Me.GDTracking.DataSource = Me.MyDatable
				Me.GDTracking.DataBind()
				Me.Session("DAD_T") = Me.MyDatable
				Me.MyDatable = Nothing
			Else
				Me.GDTracking.DataSource = Nothing
				Me.GDTracking.DataBind()
			End If
		Catch ex As Exception
			Me.lblerr.Text = ex.Message
		End Try
	End Sub

	' Token: 0x06000098 RID: 152 RVA: 0x000053E0 File Offset: 0x000035E0
	Public Function SendLoginDetails(EmployeeName As String, RecepientEmail As String, ccemail As String) As Boolean
		Dim flag As Boolean = False
		Dim dataManagement As DataManagement = New DataManagement()
		Dim dataTable As DataTable = New DataTable()
		Dim sysSettsEncryption As SysSettsEncryption = New SysSettsEncryption()
		Try
			Dim text As String = ConfigurationManager.AppSettings("LoginFromEmail").Trim()
			Dim text2 As String = ConfigurationManager.AppSettings("LoginDisplayName").Trim()
			Dim text3 As String = ConfigurationManager.AppSettings("LoginSubject").Trim()
			Dim text4 As String = ConfigurationManager.AppSettings("EmailServer").Trim()
			Dim text5 As String = ConfigurationManager.AppSettings("EmailUsername").Trim()
			Dim text6 As String = ConfigurationManager.AppSettings("EmailPassword").Trim()
			Dim stringBuilder As StringBuilder = New StringBuilder()
			stringBuilder = stringBuilder.Append("<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>")
			stringBuilder = stringBuilder.Append("<html xmlns='http://www.w3.org/1999/xhtml' >")
			stringBuilder = stringBuilder.Append("<head>")
			stringBuilder = stringBuilder.Append("</head>")
			stringBuilder = stringBuilder.Append("<body>")
			stringBuilder = stringBuilder.Append("<table style='width: 668px'>")
			stringBuilder = stringBuilder.Append("<tr>")
			stringBuilder = stringBuilder.Append("<td colspan='3'>")
			stringBuilder = stringBuilder.Append("<span style='font-size: 11pt; font-family: Calibri'><b><u>Dear, " & Me.Session("to") & " </u></b> </span>")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<br />")
			Dim text7 As String = Me.Session("Header")
			stringBuilder = stringBuilder.Append("<span style='font-size: 11pt; font-family: Calibri'><b>" & Me.Session("msg") & " </b></span>")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No:" & Me.FILE_NO.Text & " </b></span>")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Client Name: " & Me.txtProposer.Text & " </b></span>")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date : " & DateTime.Now() & " </b></span>")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Forwaded By : " & Me.Session("FullNames") & " </b></span>")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("----------------------------------------Notes--------------------------------------------------------")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("" + Me.txtcomment.Text + "")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("----------------------------------------End--------------------------------------------------------------------")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("<span style='font-size: 11pt; font-color:RED; font-family: Calibri'><b><i>THIS IS A SYSTEM GENERATED EMAIL.DO NOT REPLY!.</i></b>")
			stringBuilder = stringBuilder.Append("<br />")
			stringBuilder = stringBuilder.Append("</table>")
			stringBuilder = stringBuilder.Append("</body>")
			stringBuilder = stringBuilder.Append("</html>")
			Dim emailing As Emailing = New Emailing()
			flag = emailing.SendNotification("", text7, stringBuilder.ToString(), True, text4, text5, text6, RecepientEmail, EmployeeName, text, text2, ccemail)
			Me.Session("MailSent") = flag
		Catch ex As Exception
			flag = False
		End Try
		Return flag
	End Function

	' Token: 0x06000099 RID: 153 RVA: 0x00005838 File Offset: 0x00003A38


	' Token: 0x0600009A RID: 154 RVA: 0x00005888 File Offset: 0x00003A88


	' Token: 0x0600009B RID: 155 RVA: 0x0000593C File Offset: 0x00003B3C
	Protected Sub btnnew_Click(sender As Object, e As EventArgs) Handles btnnew.Click
		Me.HiddenField1.Value = 0
		Me.txtProposer.Enabled = True
		Me.dtreceivedate.Enabled = True
		Me.cboCard.Enabled = True
		Me.cboBusiness.Enabled = True
		Me.cboclient.Enabled = True
		Me.btnsave.Enabled = True
		Me.txt_PIN.Enabled = True
		Me.txtNID.Enabled = True
		Me.chkwalkin.Enabled = True
		Me.txtProposer.Text = ""
		Me.FILE_NO.Text = ""
		Me.chkwalkin.Checked = True
		Me.lblSave.Text = ""
		Me.dtreceivedate.DbSelectedDate = DateTime.Now
		Me.cboCard.Text = ""
		Me.cboBusiness.SelectedValue = ""
		Me.cboclient.SelectedValue = ""
		Me.txt_PIN.Text = ""
		Me.txtNID.Text = ""
		Me.txtpaid.Text = 0
	End Sub

	' Token: 0x0600009C RID: 156 RVA: 0x00005A78 File Offset: 0x00003C78
	Protected Sub cboBUS_SelectedIndexChanged(sender As Object, e As RadComboBoxSelectedIndexChangedEventArgs) Handles cboBUS.SelectedIndexChanged

	End Sub


End Class
