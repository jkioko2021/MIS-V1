<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Allocation_Corp.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1170px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="CORPORATE ALLOCATION" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 1025px" align="right">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" />
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Skin="Web20" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Text="Search" Skin="Simple">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="Label154" runat="server" Font-Bold="True" Text="Premium Refunds"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel33" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTrackingRef" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="Refund_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                  
                                                                    <telerik:GridBoundColumn DataField="Refund_No" 
                                                                        FilterControlAltText="Filter Receive_dt column" HeaderText="Refund_No" 
                                                                        SortExpression="Refund_No" UniqueName="Refund_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Request_Dt" 
                                                                        FilterControlAltText="Filter Request_Dt column" HeaderText="Request_Dt" 
                                                                        SortExpression="Request_Dt" UniqueName="Request_Dt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Payee_Name" 
                                                                        FilterControlAltText="Filter Payee_Name column" HeaderText="Payee_Name" 
                                                                        SortExpression="Payee_Name" UniqueName="Payee_Name">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Amount_Paid" 
                                                                        FilterControlAltText="Filter Amount_Paid column" HeaderText="Amount_Paid" 
                                                                        SortExpression="Amount_Paid" UniqueName="Amount_Paid">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Refund_Amt" 
                                                                        FilterControlAltText="Filter Refund_Amt column" HeaderText="Refund_Amt" 
                                                                        SortExpression="Refund_Amt" UniqueName="Refund_Amt">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Refund_Status" 
                                                                        FilterControlAltText="Filter Refund_Status column" HeaderText="Refund_Status" 
                                                                        SortExpression="Refund_Status" UniqueName="Refund_Status">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Refund_Type" 
                                                                        FilterControlAltText="Filter Refund_Type column" HeaderText="Refund_Type" 
                                                                        SortExpression="Refund_Type" UniqueName="Refund_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Entered_By" 
                                                                        FilterControlAltText="Filter Entered_By column" HeaderText="Entered_By" 
                                                                        SortExpression="Entered_By" UniqueName="Entered_By">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <asp:Panel ID="Panel11" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1128px">
                                                        <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Web20" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                        UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                        <telerik:GridBoundColumn DataField="Forward_Date" 
                                                                        FilterControlAltText="Filter Forward_Date column" HeaderText="Forward_Dt" 
                                                                        SortExpression="Forward_Date" UniqueName="Forward_Date">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Client_Type" 
                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                    </telerik:GridBoundColumn>   
                                                                    <telerik:GridBoundColumn DataField="Business_Type" 
                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                    </telerik:GridBoundColumn>                                                   
                                                                 <telerik:GridBoundColumn DataField="Is_Branch" 
                                                                        FilterControlAltText="Filter Is_Branch column" HeaderText="Is_Shwaari" 
                                                                        SortExpression="Is_Branch" UniqueName="Is_Branch">
                                                                    </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="File_Status" 
                                                                        FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                        ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                        Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                        <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                        <ItemStyle CssClass="ButtonColumn" />
                                                                    </telerik:GridButtonColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                                            MultiPageID="RadMultiPage1" SelectedIndex="0" Skin="Web20" Width="100%">
                                            <Tabs>
                                                <telerik:RadTab runat="server" Text="Register" Selected="True" 
                                                    SelectedIndex="0">
                                                </telerik:RadTab>
                                                <telerik:RadTab runat="server" Text="Documentation">
                                                </telerik:RadTab>
                                            </Tabs>
                                        </telerik:RadTabStrip>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="1100px">
                                            <telerik:RadPageView ID="V1" runat="server" Selected="True">
                                                <asp:Panel ID="Panel16" runat="server">
                                                    <table style="width: 100%">
                                                        <tr>
                                                            <td style="width: 163px; ">
                                                                &nbsp;</td>
                                                            <td style="width: 431px; " class="style17">
                                                                &nbsp;</td>
                                                            <td style="width: 132px" class="style17">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="4" style="height: 40px">
                                                                <asp:Label ID="Label145" runat="server" Text="Proposer Details" 
                                                                    Font-Bold="True" Font-Size="Medium"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; ">
                                                                &nbsp;</td>
                                                            <td style="width: 431px; " class="style17">
                                                                &nbsp;</td>
                                                            <td style="width: 132px" class="style17">
                                                                <asp:Label ID="Label180" runat="server" Text="Receive Date"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadDatePicker ID="dtreceivedate" Runat="server" Enabled="False" 
                                                                    MinDate="" Skin="Web20">
                                                                    <Calendar Skin="Web20" UseColumnHeadersAsSelectors="False" 
                                                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                    </Calendar>
                                                                    <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                    </DateInput>
                                                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                </telerik:RadDatePicker>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; ">
                                                                <asp:Label ID="Label181" runat="server" Text="Proposer Name"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px; ">
                                                                <telerik:RadTextBox ID="txtProposer" Runat="server" Skin="Web20" Width="250px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; ">
                                                                <asp:Label ID="Label183" runat="server" Text="Client Type"></asp:Label>
                                                            </td>
                                                            <td style="width: 431px; " class="style17">
                                                                <telerik:RadComboBox ID="cboclient" Runat="server" Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboclient" Selected="True" 
                                                                            Text="SME" Value="S" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="CORPORATE" Value="C" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 132px" class="style17">
                                                                <asp:Label ID="Label182" runat="server" Text="CR12"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadTextBox ID="txtCR12" Runat="server" Skin="Web20" Width="250px">
                                                                </telerik:RadTextBox>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; ">
                                                                <asp:Label ID="Label187" runat="server" Text="Business"></asp:Label>
                                                            </td>
                                                            <td style="width: 431px" class="style17">
                                                                <telerik:RadComboBox ID="cboBUS" Runat="server" Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBUS" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Medical" Value="M" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Non Medical" Value="N" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 132px" class="style17">
                                                                <asp:Label ID="Label186" runat="server" Text="County"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadComboBox ID="cboCounty" Runat="server" Skin="Web20" Width="250px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboCounty" Selected="True" 
                                                                            Text="Retail" Value="R" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; height: 26px;">
                                                                <asp:Label ID="Label191" runat="server" Text="Category"></asp:Label>
                                                            </td>
                                                            <td class="style17" style="width: 431px; height: 26px;">
                                                                <telerik:RadComboBox ID="cbocategory" Runat="server" Skin="Web20" 
                                                                    Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Public" Value="Public" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="Private" Value="Private" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td class="style17" style="width: 132px; height: 26px;">
                                                                <asp:Label ID="Label192" runat="server" Text="Sector"></asp:Label>
                                                            </td>
                                                            <td style="height: 26px">
                                                                <telerik:RadComboBox ID="cboSector" Runat="server" Skin="Web20" Width="250px" 
                                                                    AllowCustomText="True">
                                                                </telerik:RadComboBox>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; ">
                                                                <asp:Label ID="Label185" runat="server" Text="Agent/Broker"></asp:Label>
                                                            </td>
                                                            <td style="width: 431px;" class="style17">
                                                                <telerik:RadComboBox ID="cboagent" Runat="server" Skin="Web20" Width="300px" 
                                                                    AccessibilityMode="True" AllowCustomText="True" MarkFirstMatch="True">
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 132px; " class="style17">
                                                                <asp:Label ID="Label193" runat="server" Text="Rate Type"></asp:Label>
                                                            </td>
                                                            <td>
                                                                <telerik:RadComboBox ID="cborateType" Runat="server" Skin="Web20" 
                                                                    Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cborateType" 
                                                                            Text="Standard Rates" Value="S" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cborateType" Text="Custom Rates" 
                                                                            Value="C" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                                </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; ">
                                                                <asp:Label ID="Label188" runat="server" Text="Business/Action Type"></asp:Label>
                                                            </td>
                                                            <td style="width: 431px; " class="style17">
                                                                <telerik:RadComboBox ID="cboBusiness" Runat="server" AutoPostBack="True" 
                                                                    MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="New" 
                                                                            Value="N" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Renewal" 
                                                                            Value="R" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Addon" 
                                                                            Value="A" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Termination" 
                                                                            Value="T" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                            Text="Reinstatement" Value="RT" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                            Text="Category Change" Value="CC" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                            Text="Premium Recon" Value="PR" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Nill_Endr" 
                                                                            Value="NE" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Fund_Topup" 
                                                                            Value="FT" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" Text="Suspension" 
                                                                            Value="SU" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboBusiness" 
                                                                            Text="Lift Suspension" Value="LS" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 132px; " class="style17">
                                                            </td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; ">
                                                                <asp:Label ID="Label171" runat="server" Text="Card Type"></asp:Label>
                                                            </td>
                                                            <td style="width: 431px" class="style17">
                                                                <telerik:RadComboBox ID="cboCard" Runat="server" 
                                                                    MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboCard" Selected="True" 
                                                                            Text="MTIBA" Value="MTIBA" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="SMART" 
                                                                            Value="SMART" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 132px" class="style17">
                                                                &nbsp;</td>
                                                            <td>
                                                                &nbsp;</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px;">
                                                                <asp:Label ID="Label190" runat="server" Text="Payment Mode"></asp:Label>
                                                            </td>
                                                            <td style="width: 431px;" class="style17">
                                                                <telerik:RadComboBox ID="cboPayment" Runat="server" MarkFirstMatch="True" 
                                                                    Skin="Web20" Width="190px">
                                                                    <Items>
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboPayment" Selected="True" 
                                                                            Text="MPESA" Value="MPESA" />
                                                                        <telerik:RadComboBoxItem runat="server" Owner="cboPayment" Text="EFT" 
                                                                            Value="EFT" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="CHEQ" Value="CHEQ" />
                                                                        <telerik:RadComboBoxItem runat="server" Text="IPF" Value="IPF" />
                                                                    </Items>
                                                                </telerik:RadComboBox>
                                                            </td>
                                                            <td style="width: 132px" class="style17">
                                                                &nbsp;</td>
                                                            <td>
                                                                <asp:CheckBox ID="chkmedical" runat="server" Enabled="False" 
                                                                    Text="Medical underwriting" />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width: 163px; height: 31px;">
                                                                </td>
                                                            <td style="width: 431px; height: 31px;" class="style17">
                                                                <telerik:RadButton ID="btnedit" runat="server" Skin="Simple" Text="Edit" 
                                                                    Width="73px">
                                                                </telerik:RadButton>
                                                                &nbsp;<telerik:RadButton ID="btnupdate" runat="server" Skin="Simple" Text="update" 
                                                                    Width="90px">
                                                                </telerik:RadButton>
                                                            </td>
                                                            <td style="width: 132px; height: 31px;" class="style17">
                                                                </td>
                                                            <td style="height: 31px">
                                                                <asp:Label ID="refno" runat="server"></asp:Label>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </asp:Panel>
                                            </telerik:RadPageView>
                                            <telerik:RadPageView ID="V2" runat="server" Width="1144px">
                                                <asp:Panel ID="Panel2" runat="server">
                                                    <table style="width: 99%">
                                                        <tr>
                                                            <td>
                                                                <asp:Label ID="Label147" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                                    Width="1100px">
                                                                    <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                        GridLines="None" Height="100%" Skin="Web20" Width="100%">
                                                                        <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </RowIndicatorColumn>
                                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                <HeaderStyle Width="20px" />
                                                                            </ExpandCollapseColumn>
                                                                            <Columns>
                                                                            
                                                                                <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                                    FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                                    SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="File_No" 
                                                                                    FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                    SortExpression="File_No" UniqueName="File_No">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                                    FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                                    SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                                    FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                                    SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="File_Name" 
                                                                                    FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                                    SortExpression="File_Name" UniqueName="File_Name">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridBoundColumn DataField="Upload_By" 
                                                                                    FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                                    SortExpression="Upload_By" UniqueName="Upload_By">
                                                                                </telerik:GridBoundColumn>
                                                                                <telerik:GridTemplateColumn AllowFiltering="false" HeaderText="View" 
                                                                                    SortExpression="DOC_ID">
                                                                                                                                    <ItemTemplate>
                  <asp:LinkButton ID="lnkDownload" runat="server" Text="Download" OnClick="DownloadFile"
                    CommandArgument='<%# Eval("DOC_ID") %>'></asp:LinkButton>
                  </ItemTemplate>
                                                                                </telerik:GridTemplateColumn>
                                                                            </Columns>
                                                                            <EditFormSettings>
                                                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                </EditColumn>
                                                                            </EditFormSettings>
                                                                        </MasterTableView>
                                                                        <FilterMenu EnableImageSprites="False">
                                                                        </FilterMenu>
                                                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                        </HeaderContextMenu>
                                                                    </telerik:RadGrid>
                                                                </asp:Panel>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <asp:Panel ID="Panel13" runat="server" BorderStyle="Solid" Height="100%" 
                                                                    ScrollBars="Horizontal" Width="1071px">
                                                                    <asp:Literal ID="ltEmbed" runat="server" />
                                                                </asp:Panel>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="height: 17px;">
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </asp:Panel>
                                            </telerik:RadPageView>
                                        </telerik:RadMultiPage>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#666666">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="height: 34px">
                                        <table style="width: 100%">
                                            <tr>
                                                <td style="width: 193px; text-align: left;">
                                                    <asp:Label ID="Label175" runat="server" Text="Product"></asp:Label>
                                                </td>
                                                <td style="width: 246px; text-align: left;">
                                                    <telerik:RadComboBox ID="CboProd" Runat="server" Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="CboProd" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="CboProd" Text="Traditional" 
                                                                Value="T" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Shwaari" Value="Shwaari" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Afya_Shwaari" 
                                                                Value="Afya_Shwaari" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="text-align: left">
                                                    &nbsp;</td>
                                                <td style="text-align: left">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; text-align: left;">
                                                    <asp:Label ID="Label150" runat="server" Text="Action"></asp:Label>
                                                </td>
                                                <td style="width: 246px; text-align: left;">
                                                    <telerik:RadComboBox ID="cboAction" Runat="server" AllowCustomText="True" 
                                                        MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" 
                                                                Text="Return-Incomplete" Value="RI" />
                                                            <telerik:RadComboBoxItem runat="server" Owner="cboAction" 
                                                                Text="Allocate-Membership" Value="A" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Medical UW" Value="MU" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Cashier" Value="CA" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="text-align: left">
                                                    &nbsp;</td>
                                                <td style="text-align: left">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; text-align: left;">
                                                    <asp:Label ID="Label151" runat="server" Text="Forward to"></asp:Label>
                                                </td>
                                                <td style="width: 246px; text-align: left;">
                                                    <telerik:RadComboBox ID="cboAllocateto" Runat="server" AllowCustomText="True" 
                                                        MarkFirstMatch="True" Skin="Web20" Width="190px">
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td colspan="2" style="text-align: left">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; text-align: left;">
                                                    <asp:Label ID="Label152" runat="server" Text="Entered By"></asp:Label>
                                                </td>
                                                <td style="width: 246px; text-align: left;">
                                                    <asp:Label ID="lblenteredby" runat="server"></asp:Label>
                                                </td>
                                                <td colspan="2" style="text-align: left">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; text-align: left;">
                                                    <asp:Label ID="Label144" runat="server" Text="Notes"></asp:Label>
                                                </td>
                                                <td rowspan="2">
                                                    <telerik:RadTextBox ID="txtcomment" Runat="server" Height="50px" Skin="Web20" 
                                                        TextMode="MultiLine" Width="450px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td colspan="2">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; text-align: left;">
                                                    &nbsp;</td>
                                                <td colspan="2">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 193px; height: 38px; text-align: left;">
                                                </td>
                                                <td style="height: 38px; text-align: left;">
                                                    <telerik:RadButton ID="btnforward" runat="server" Skin="Simple" Text="Forward " 
                                                        Width="200px">
                                                    </telerik:RadButton>
                                                </td>
                                                <td colspan="2" style="height: 38px">
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height: 41px">
                                        &nbsp;<asp:Label ID="lblerr" runat="server" Font-Bold="True" ForeColor="Red" 
                                            Font-Size="Medium"></asp:Label>
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="1157px">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Web20" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                            FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                            ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="File_No" 
                                                            FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                            ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Note_From" 
                                                            FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                            ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Notes" 
                                                            FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                            SortExpression="Notes" UniqueName="Notes">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <ItemStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
            </ContentTemplate>
       
            </asp:UpdatePanel>
</asp:Content>



